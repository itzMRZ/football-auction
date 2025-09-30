# ⚽ Football Player Auction System

A live-stream-friendly web application for conducting football player auctions with real-time budget tracking and team management.

## 🎯 Features

- **Live Stream Ready**: Single-view interface optimized for streaming
- **Real-time Updates**: Auto-saves to localStorage for data safety
- **4 Color-Coded Teams**: Visual distinction for each captain's team
- **Budget Tracking**: Real-time budget monitoring with warning indicators
- **Auto-Advance**: Automatically moves to next player after award
- **Export Options**: Download final teams as JSON or PDF
- **Fullscreen Mode**: Perfect for presentations and live streams
- **Data Persistence**: Never lose your auction progress

## 👥 Teams

- **Team Moin** (Captain: Moin) - Blue
- **Team Sharar** (Captain: Sharar) - Green
- **Team MRZ** (Captain: MRZ) - Orange  
- **Team Mahim** (Captain: Mahim) - Red

## 🎮 How to Use

1. Open the site (requires a local server or GitHub Pages)
2. Navigate through players using Previous/Next buttons
3. Enter bid amount and click a captain's "Award" button
4. System auto-saves after each award
5. Use Fullscreen button for live stream display
6. Export final teams when auction completes

## 💾 Data Safety

- Auto-saves to browser localStorage after every action
- Prompts to restore previous session on page load
- Reset button available to start fresh
- Export teams anytime to preserve results

## 📦 Project Structure

```
football-auction/
├── index.html       # Main interface
├── styles.css       # Styling
├── script.js        # Application logic with localStorage
├── data/
│   ├── players.json    # Player data (16 players)
│   ├── captains.json   # Captain/team data (4 teams)
│   └── config.json     # Auction configuration
└── assets/          # Player images
```

## ⚙️ Configuration

Edit `data/config.json` to customize:
- `teamSize`: Number of players per team (default: 5)
- `initialBudget`: Starting budget per captain (default: 10000)

## 🚀 Running Locally

### Option 1: Python
```bash
cd football-auction
python -m http.server 5500
```
Then open: `http://localhost:5500`

### Option 2: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

## 📝 License

MIT License - Free to use and modify
