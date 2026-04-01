"""
ICU Consent App — Flask API Backend  (Phase 7)
================================================
Serves the PDF/Word document generator as a REST endpoint.
The React PWA calls POST /api/generate-pdf or /api/generate-docx.

Install:
    pip install flask flask-cors

Run (dev):
    python3 api/app.py

Run (prod):
    gunicorn -w 2 -b 0.0.0.0:5000 api.app:app

V2 hooks (clearly marked):
    - /api/send-email  (stubbed — for background sync email queue)
    - /api/fhir/       (stubbed — for EMR integration)
    - /api/auth/       (stubbed — for per-doctor login)
"""

import sys
import os
import json
import uuid
from datetime import datetime

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io

# Add project root to path so we can import icu_consent_pdf
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

try:
    from icu_consent_pdf import build_pdf
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("Warning: icu_consent_pdf not found — PDF endpoint will be unavailable")

try:
    from generate_consent import buildDocument as build_docx_js
    # Note: generate_consent.js is a Node.js script, not Python.
    # For production, call it via subprocess or use python-docx instead.
    DOCX_VIA_NODE = True
except ImportError:
    DOCX_VIA_NODE = False

app = Flask(__name__)

# Allow requests from React dev server and production origin
CORS(app, origins=[
    "http://localhost:3000",
    "http://localhost:5173",
    "https://icu-consent.yourhospital.in",  # replace with actual domain
])

# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "version": "1.0.0",
        "pdf_available": PDF_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat(),
    })


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE PDF
# POST /api/generate-pdf
# Body: JSON payload (same structure as generate_pdf.py data dict)
# Returns: application/pdf binary
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/generate-pdf", methods=["POST"])
def generate_pdf_endpoint():
    if not PDF_AVAILABLE:
        return jsonify({"error": "PDF generator not available"}), 503

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No JSON body received"}), 400

        # Add docId if not provided
        if not data.get("docId"):
            data["docId"] = uuid.uuid4().hex[:6].upper()

        pdf_bytes = build_pdf(data)

        # Compose filename
        uhid    = data.get("patientData", {}).get("uhid", "NOID")
        session = data.get("patientData", {}).get("sessionNumber", "1")
        today   = datetime.now().strftime("%d-%m-%Y")
        fname   = f"ICU_Consent_{uhid}_{today}_Session{session}.pdf"

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=fname,
        )

    except Exception as e:
        print(f"PDF generation error: {e}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE WORD DOCUMENT
# POST /api/generate-docx
# Body: JSON payload
# Returns: application/docx binary (via Node.js subprocess)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/generate-docx", methods=["POST"])
def generate_docx_endpoint():
    try:
        import subprocess
        import tempfile

        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No JSON body received"}), 400

        if not data.get("docId"):
            data["docId"] = uuid.uuid4().hex[:6].upper()

        # Write payload to temp file, call Node.js script
        with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as jf:
            json.dump(data, jf, ensure_ascii=False)
            json_path = jf.name

        out_path = json_path.replace(".json", ".docx")

        result = subprocess.run(
            ["node", "generate_consent_api.js", json_path, out_path],
            capture_output=True, text=True, timeout=30,
        )

        os.unlink(json_path)

        if result.returncode != 0:
            return jsonify({"error": result.stderr}), 500

        uhid    = data.get("patientData", {}).get("uhid", "NOID")
        session = data.get("patientData", {}).get("sessionNumber", "1")
        today   = datetime.now().strftime("%d-%m-%Y")
        fname   = f"ICU_Consent_{uhid}_{today}_Session{session}.docx"

        return send_file(
            out_path,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            as_attachment=True,
            download_name=fname,
        )

    except Exception as e:
        print(f"DOCX generation error: {e}", file=sys.stderr)
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# V2 HOOK — EMAIL SEND (stubbed)
# Called by background sync when an email was queued offline
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/send-email", methods=["POST"])
def send_email():
    # V2: EMR_BRIDGE — replace this stub with actual SMTP or SendGrid call
    # When activated: pip install flask-mail or sendgrid
    data = request.get_json(force=True) or {}
    print(f"[EMAIL STUB] Would send to: {data.get('to')} — Subject: {data.get('subject')}")
    return jsonify({
        "status": "stub",
        "message": "Email sending not yet active — V2 feature",
        "data": data,
    })


# ─────────────────────────────────────────────────────────────────────────────
# V2 HOOK — FHIR EMR INTEGRATION (stubbed)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/fhir/consent", methods=["POST"])
def fhir_consent():
    # V2: EMR_BRIDGE — replace this stub with FHIR R4 API POST
    # When activated: pip install fhirclient
    data = request.get_json(force=True) or {}
    print(f"[FHIR STUB] Would post Consent resource for patient: {data.get('patient', {}).get('id')}")
    return jsonify({
        "status": "stub",
        "message": "FHIR integration not yet active — V2 feature",
        "resourceType": "Consent",
    })


# ─────────────────────────────────────────────────────────────────────────────
# V2 HOOK — PER-DOCTOR AUTH (stubbed)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    # V2: Per-doctor login — deferred to V2
    return jsonify({
        "status": "stub",
        "message": "Per-doctor login not yet active — V2 feature",
    })


# ─────────────────────────────────────────────────────────────────────────────
# AUDIT LOG (local, no clinical content)
# ─────────────────────────────────────────────────────────────────────────────
AUDIT_LOG = []

@app.route("/api/audit", methods=["POST"])
def audit_log():
    entry = request.get_json(force=True) or {}
    entry["serverTimestamp"] = datetime.utcnow().isoformat()
    AUDIT_LOG.append(entry)
    # In V2: persist to database
    return jsonify({"status": "logged"})


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"ICU Consent API starting on port {port} (debug={debug})")
    print(f"PDF available: {PDF_AVAILABLE}")
    app.run(host="0.0.0.0", port=port, debug=debug)
