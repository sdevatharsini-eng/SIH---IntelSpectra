IntelSpectra — AI/ML Video Intelligence Backend

🚀 IntelSpectra is an AI/ML-powered video intelligence backend developed for Smart India Hackathon 2025 under the Ministry of Home Affairs problem statement: AI/ML-enabled Video Analysis and Interpretation.

The system automates the extraction of actionable insights from surveillance video feeds (CCTV, drones, bodycams, robots), delivering real-time alerts, forensic search, and predictive analytics to support NSG operations.

🔍 Problem

NSG operates a wide array of surveillance devices that generate massive video data.
Currently:

Analysts manually review feeds → time-consuming, error-prone.
No unified tool for real-time detection + post-incident forensics.
High risk of missed threats due to information overload.
💡 Proposed Solution

IntelSpectra provides an AI/ML backend that ingests live or archived video and outputs threat alerts, forensic reports, heatmaps, and NLP-based video search.

Core Features:

🎯 Targeted Threat Alerts → Instant alerts sent only to nearest responders.
🎧 Private Voice Delivery → Alerts delivered via headphones, avoiding panic.
📡 Hybrid Location Accuracy → GPS + BLE/UWB fusion for precise positioning.
👤 Human-in-Loop Verification → Alerts require acknowledgment → prevents false alarms.
🤖 Customizable AI Models → Trained on NSG-specific datasets, reducing false positives.
🕵️ Dual Mode → Edge real-time detection + post-event forensic analysis.
🔎 Natural-Language Search → Query archived video (e.g., “Show person leaving bag near Gate 3 after 6 PM”).
📊 Predictive Intelligence → Risk scoring + incident heatmaps for proactive deployment.
🛠️ Technical Approach

Technologies:

Detection & Action Recognition: YOLOv8, SlowFast (3D CNNs).
NLP Video Search: CLIP embeddings + metadata indexing.
Backend: Python (FastAPI), Kafka/Redis, ONNX/Triton inference server.
Edge AI: NVIDIA Jetson / Intel NPU.

Architecture Flow:

Ingest → CCTV, drone, bodycam feeds.
Edge Agents → Low-latency inference.
Event Bus → Kafka/Redis for async processing.
Model Serving → Detection, Action, Audio fusion.
Storage & Analytics → Forensics, heatmaps, reports.
Outputs → Alerts (voice/text), reports, NLP queries, C2 integration.
📈 Impact & Benefits
Operational: Detect threats live, reduce missed incidents, speed up forensics.
Economic: Reuses legacy cameras, reduces manpower costs.
Social: Safer zones, privacy-aware (face redaction by default).
📂 Project Structure
IntelSpectra/
│── backend/         # FastAPI services, event bus, model APIs
│── models/          # YOLOv8, SlowFast, CLIP models + weights
│── edge/            # Jetson/Intel NPU optimized inference
│── web/             # Analyst dashboard (React/Next.js or similar)
│── docs/            # Diagrams, SIH PPT, architecture notes
│── tests/           # Unit and integration tests
│── data/            # Sample datasets / configs
│── README.md        # Project overview
📚 Research & References
YOLOv8 — Ultralytics (2023)
SlowFast Networks — Facebook AI
CLIP — OpenAI (2021)
ACM MM (2023) — Multimodal fusion research
NSG operational needs — Public reports
Datasets: COCO, AVA Action, Synthetic augmentation
👥 Team IntelSpectra
Team Leader: Agastina P
Category: Software
Event: Smart India Hackathon 2025
