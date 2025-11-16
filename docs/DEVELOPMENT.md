## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm run dev
```
Vite provides hot module replacement for instant updates.

### Backend Development
The Flask server runs with `debug=True` for auto-reloading on code changes.

### Adding New Features

1. **Backend**: Add routes in `backend/app.py` or create new files in `backend/api/`
2. **Frontend**: Create new components in `frontend/src/components/` or pages in `frontend/src/pages/`
3. **Database**: Modify schema in `backend/database.py`

## 🐛 Troubleshooting

### Database Issues
Delete `backend/cybercache.db` to reset the database. It will be recreated on next startup.

### File Not Importing
- Check file extension is in `ALLOWED_EXTENSIONS`
- Verify file is in a watched directory
- Check backend console for error messages

### Search Not Working
- Ensure SQLite version supports FTS5 (3.9.0+)
- Check for errors in backend console
- Try rebuilding the FTS index by restarting the backend

### Port Already in Use
Change ports in:
- Backend: `app.run(port=5000)` in `backend/app.py`
- Frontend: `server.port` in `frontend/vite.config.js`