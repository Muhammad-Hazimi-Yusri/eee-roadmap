# EEE Roadmap 🔌⚡

An interactive learning roadmap for Electrical and Electronic Engineering with built-in circuit simulators.

## 🎯 Vision

Similar to roadmap.sh but specifically for EEE, combining:
- Clear, structured learning paths
- Interactive circuit simulators at each stage
- Progress tracking and gamification
- 100% open source and free

## 🚀 Live Demo

[Coming Soon - Deploy to GitHub Pages]

## ✨ Features

### Current (v0.1)
- ✅ Interactive roadmap visualization using D3.js
- ✅ Hierarchical learning path structure
- ✅ Responsive design
- ✅ Clean, modern UI

### Planned Features
- [ ] WebAssembly-based circuit simulator (Rust)
- [ ] Individual learning modules with theory + practice
- [ ] Progress tracking with local storage
- [ ] Resource links (MIT OCW, Khan Academy, etc.)
- [ ] Community contributions
- [ ] Dark mode
- [ ] PWA support for offline access

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: D3.js
- **Circuit Simulator**: WebAssembly (Rust) - *Coming Soon*
- **Build Tools**: Vite/Webpack - *Coming Soon*
- **Deployment**: GitHub Pages

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/Muhammad-Hazimi-Yusri/eee-roadmap.git
cd eee-roadmap
```

2. Install dependencies (optional, for development):
```bash
npm install
```

3. Start a local server:
```bash
# Using Python
python3 -m http.server 8000

# Or using Node.js (after npm install)
npm start

# Or using live-server for auto-reload
npm run dev
```

4. Open your browser and navigate to `http://localhost:8000`

## 🗺️ Roadmap Structure

```
├── Fundamentals
│   ├── Circuit Theory (DC/AC)
│   ├── Mathematics
│   └── Physics (Electromagnetics)
├── Core Topics
│   ├── Electronics (Diodes, Transistors, Op-Amps)
│   ├── Digital Logic
│   └── Signals & Systems
└── Advanced
    ├── Power Systems
    ├── Control Systems
    └── Communications
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Areas needing help:
- Circuit simulator implementation (Rust/WebAssembly)
- Content creation for learning modules
- UI/UX improvements
- Testing and bug fixes
- Documentation

## 📚 Resources Referenced

- [MIT OpenCourseWare](https://ocw.mit.edu/)
- [Khan Academy EE Course](https://www.khanacademy.org/science/electrical-engineering)
- [All About Circuits](https://www.allaboutcircuits.com/)
- [Falstad Circuit Simulator](https://falstad.com/circuit/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [roadmap.sh](https://roadmap.sh)
- Circuit simulation concepts from ngspice and Falstad
- D3.js for beautiful visualizations

## 📬 Contact

- GitHub: [@Muhammad-Hazimi-Yusri](https://github.com/Muhammad-Hazimi-Yusri)
- Project Link: [https://github.com/Muhammad-Hazimi-Yusri/eee-roadmap](https://github.com/Muhammad-Hazimi-Yusri/eee-roadmap)

---

⭐ If you find this project useful, please consider giving it a star on GitHub!
