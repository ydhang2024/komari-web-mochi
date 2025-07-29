# Komari Web Mochi 🍡

A beautifully enhanced fork of [Komari Web](https://github.com/komari-monitor/komari-web) with focus on mobile UI/UX improvements.

![Komari Web Mochi](https://img.shields.io/badge/Komari-Mochi-pink?style=flat-square)
![License](https://img.shields.io/github/license/svnmoe/komari-web-mochi?style=flat-square)
![Issues](https://img.shields.io/github/issues/svnmoe/komari-web-mochi?style=flat-square)

## 🌟 Key Enhancements

### Mobile UI Improvements
- 📱 **Responsive Mobile Layout**: Fully optimized layouts for mobile devices with touch-friendly interactions
- 🎨 **Enhanced Visual Design**: Beautiful card-based UI with consistent theming across dark/light modes
- 📊 **Mobile-Optimized Charts**: Touch-friendly charts with proper tooltips and smooth animations
- 🔄 **Native-like Transitions**: Using SegmentedControl for smooth tab switching
- 🌐 **Complete i18n Support**: Fixed missing translations across all languages (EN, CN, TW, JP)

### Features from Upstream
- Real-time server monitoring
- Multi-language support
- Terminal access
- Network statistics
- Customizable themes

## 🏗️ Project Structure

```
main (stable) ─── develop (active development)
                     │
                     └─── feature/* (feature branches)
```

- **main**: Stable releases, synced with upstream
- **develop**: Active development with all enhancements
- **feature/\***: Individual feature branches

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/svnmoe/komari-web-mochi.git
cd komari-web-mochi

# Checkout develop branch for latest features
git checkout develop

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📱 Mobile Features

### Responsive Instance Page
- Adaptive layout that switches between desktop and mobile views
- Touch-optimized interface elements
- Swipe-friendly charts and controls

### Mobile Components
- **MobileDetailsCard**: Compact, information-rich cards for system details
- **MobileLoadChart**: Optimized charts for small screens with touch tooltips
- **SegmentedControl**: Native-like tab switching for better UX

## 🔄 Staying Updated with Upstream

This fork maintains compatibility with the upstream Komari Web project:

```bash
# Add upstream (if not already added)
git remote add upstream https://github.com/komari-monitor/komari-web.git

# Fetch upstream changes
git fetch upstream

# Merge upstream changes into develop
git checkout develop
git merge upstream/radix

# Resolve any conflicts and commit
git add .
git commit -m "merge: sync with upstream"
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request to the `develop` branch

### Commit Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

## 📝 Original Project

This project is based on [Komari Web](https://github.com/komari-monitor/komari-web), an excellent server monitoring solution.

### Contributing to Translations
- Use [Crowdin](https://crowdin.com/project/komari/invite?h=cd051bf172c9a9f7f1360e87ffb521692507706)
- Or submit a PR directly

## 🙏 Acknowledgments

- Original Komari Web team for the excellent foundation
- All contributors who have helped improve this fork

## 📄 License

This project follows the same license as the original Komari Web project.

---

Made with ❤️ by [SVNMOE](https://github.com/svnmoe)