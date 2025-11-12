"""
AI-powered classification system for cybersecurity resources.
Supports multiple AI providers with fallback chain.
"""

import os
import re
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()


class ResourceClassifier:
    """Classifies cybersecurity resources into categories and generates tags"""

    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')

        # Keyword-based classification patterns
        self.category_keywords = {
            'Blue Team': [
                'defense', 'defensive', 'siem', 'soc', 'monitoring', 'detection',
                'incident response', 'forensics', 'blue team', 'splunk', 'elk',
                'security operations', 'threat detection', 'ids', 'ips', 'firewall',
                'hardening', 'compliance', 'audit', 'defender', 'edr', 'xdr'
            ],
            'Red Team': [
                'offensive', 'penetration', 'pentest', 'exploit', 'attack',
                'vulnerability', 'metasploit', 'kali', 'red team', 'social engineering',
                'phishing', 'payload', 'reverse shell', 'privilege escalation',
                'lateral movement', 'persistence', 'evasion', 'bypass', 'crack'
            ],
            'Threat Intelligence': [
                'intelligence', 'threat intel', 'apt', 'indicators', 'ioc',
                'threat actor', 'campaign', 'attribution', 'malware analysis',
                'threat hunting', 'osint', 'reconnaissance', 'mitre att&ck',
                'threat landscape', 'adversary', 'ttp'
            ]
        }

        self.tag_keywords = {
            'virtual-machine': ['vm', 'virtual machine', 'virtualbox', 'vmware', 'ova', 'ovf'],
            'cheatsheet': ['cheat sheet', 'cheatsheet', 'quick reference', 'commands'],
            'poster': ['poster', 'infographic', 'visual guide', 'reference card'],
            'tool': ['tool', 'software', 'utility', 'application', 'framework'],
            'framework': ['framework', 'methodology', 'standard', 'model'],
            'guide': ['guide', 'tutorial', 'walkthrough', 'handbook', 'manual'],
            'training': ['training', 'course', 'learning', 'education', 'ctf'],
            'certification': ['certification', 'cert', 'exam', 'qualification'],
            'documentation': ['documentation', 'docs', 'reference', 'specification'],
            'research': ['research', 'paper', 'whitepaper', 'study', 'analysis'],
        }

    def classify(self, title: str, description: str = '', content: str = '',
                 filename: str = '', url: str = '') -> Dict[str, any]:
        """
        Classify a resource using fallback chain:
        1. OpenAI (if API key available)
        2. Anthropic Claude (if API key available)
        3. Keyword-based classification
        """
        text = f"{title} {description} {content} {filename} {url}".lower()

        # Try AI providers in order
        result = None

        if self.openai_api_key:
            result = self._classify_openai(title, description, content, filename, url)
            if result:
                result['classifier'] = 'openai'
                return result

        if self.anthropic_api_key:
            result = self._classify_anthropic(title, description, content, filename, url)
            if result:
                result['classifier'] = 'anthropic'
                return result

        # Fallback to keyword-based
        result = self._classify_keywords(text)
        result['classifier'] = 'keywords'
        return result

    def _classify_openai(self, title: str, description: str, content: str,
                         filename: str, url: str) -> Optional[Dict]:
        """Classify using OpenAI GPT"""
        try:
            from openai import OpenAI

            client = OpenAI(api_key=self.openai_api_key)

            prompt = self._build_classification_prompt(title, description, content, filename, url)

            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Fast and cost-effective
                messages=[
                    {"role": "system", "content": "You are a cybersecurity expert that classifies resources."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=200
            )

            return self._parse_classification_response(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI classification failed: {e}")
            return None

    def _classify_anthropic(self, title: str, description: str, content: str,
                           filename: str, url: str) -> Optional[Dict]:
        """Classify using Anthropic Claude"""
        try:
            from anthropic import Anthropic

            client = Anthropic(api_key=self.anthropic_api_key)

            prompt = self._build_classification_prompt(title, description, content, filename, url)

            response = client.messages.create(
                model="claude-3-haiku-20240307",  # Fast and cost-effective
                max_tokens=200,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            return self._parse_classification_response(response.content[0].text)
        except Exception as e:
            print(f"Anthropic classification failed: {e}")
            return None

    def _classify_keywords(self, text: str) -> Dict:
        """Classify using keyword matching"""
        # Determine primary category
        category_scores = {}
        for category, keywords in self.category_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                category_scores[category] = score

        # Get category with highest score, default to first match or None
        primary_category = max(category_scores, key=category_scores.get) if category_scores else None

        # Generate tags
        tags = []
        for tag, keywords in self.tag_keywords.items():
            if any(keyword in text for keyword in keywords):
                tags.append(tag)

        # Add category-specific tags
        if primary_category:
            if 'Blue Team' in primary_category:
                tags.append('defensive')
            elif 'Red Team' in primary_category:
                tags.append('offensive')
            elif 'Intelligence' in primary_category:
                tags.append('intelligence')

        return {
            'category': primary_category,
            'tags': tags,
            'confidence': 'medium' if category_scores else 'low'
        }

    def _build_classification_prompt(self, title: str, description: str,
                                     content: str, filename: str, url: str) -> str:
        """Build classification prompt for AI"""
        content_preview = content[:500] if content else ''

        return f"""Classify this cybersecurity resource into ONE of these categories and suggest relevant tags.

Title: {title}
Description: {description}
Filename: {filename}
URL: {url}
Content Preview: {content_preview}

Categories (choose ONE):
- Blue Team (Defensive cybersecurity: SIEM, SOC, detection, monitoring, incident response, forensics)
- Red Team (Offensive cybersecurity: pentesting, exploitation, attacks, vulnerability assessment)
- Threat Intelligence (Threat intel, IOCs, APTs, threat hunting, OSINT, malware analysis)

Tags (suggest 3-5 from these or add relevant ones):
virtual-machine, cheatsheet, poster, tool, framework, guide, training, certification, documentation, research, malware, network, web-security, cloud, container, windows, linux, python, powershell

Respond ONLY in this exact format:
CATEGORY: [category name]
TAGS: tag1, tag2, tag3
CONFIDENCE: high/medium/low

Example:
CATEGORY: Red Team
TAGS: tool, pentesting, network, linux
CONFIDENCE: high"""

    def _parse_classification_response(self, response: str) -> Dict:
        """Parse AI response into structured data"""
        try:
            category = None
            tags = []
            confidence = 'medium'

            # Parse response
            for line in response.strip().split('\n'):
                line = line.strip()
                if line.startswith('CATEGORY:'):
                    category = line.replace('CATEGORY:', '').strip()
                elif line.startswith('TAGS:'):
                    tags_str = line.replace('TAGS:', '').strip()
                    tags = [t.strip() for t in tags_str.split(',')]
                elif line.startswith('CONFIDENCE:'):
                    confidence = line.replace('CONFIDENCE:', '').strip().lower()

            return {
                'category': category,
                'tags': tags,
                'confidence': confidence
            }
        except Exception as e:
            print(f"Failed to parse AI response: {e}")
            return None

    def extract_text_from_pdf(self, pdf_path: str, max_pages: int = 3) -> str:
        """Extract text from PDF for classification"""
        try:
            import PyPDF2

            text = []
            with open(pdf_path, 'rb') as file:
                pdf = PyPDF2.PdfReader(file)
                for i in range(min(max_pages, len(pdf.pages))):
                    page = pdf.pages[i]
                    text.append(page.extract_text())

            return ' '.join(text)[:2000]  # Limit to 2000 chars
        except Exception as e:
            print(f"Failed to extract PDF text: {e}")
            return ''

    def classify_file(self, file_path: str, title: str = '',
                     description: str = '') -> Dict:
        """Classify a file by extracting its content"""
        import os
        from pathlib import Path

        filename = os.path.basename(file_path)
        ext = Path(file_path).suffix.lower()

        # Extract content based on file type
        content = ''
        if ext == '.pdf':
            content = self.extract_text_from_pdf(file_path)
        elif ext in ['.txt', '.md']:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()[:2000]
            except:
                pass

        return self.classify(
            title=title or filename,
            description=description,
            content=content,
            filename=filename
        )

    def classify_url(self, url: str, title: str = '', description: str = '') -> Dict:
        """Classify a URL resource"""
        return self.classify(
            title=title,
            description=description,
            url=url
        )


# Singleton instance
_classifier = None

def get_classifier() -> ResourceClassifier:
    """Get or create classifier instance"""
    global _classifier
    if _classifier is None:
        _classifier = ResourceClassifier()
    return _classifier
