import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus,
  X,
  ChevronLeft,
  Trash2,
  Flag,
  ClipboardList,
  FileJson2,
  Check,
  Sparkles,
  BookMarked,
  ImagePlus,
  Scissors,
  ChevronRight,
  Loader2,
} from "lucide-react";

const STORAGE_KEY = "econ-tracker-exams-v1";

const SUBJECTS = ["경제", "정치와 법", "수학"];

const SAMPLE_JSON = JSON.stringify(
  {
    examTitle: "2027학년도 대학수학능력시험 6월 모의평가 - 경제",
    examDate: "2026-06",
    questions: [
      { number: 1, answer: "⑤", wrongRate: null, preview: "민간 부문 경제 순환에서 가계와 기업의 역할 구분" },
      { number: 2, answer: "③", wrongRate: null, preview: "시장 경제 체제와 계획 경제 체제의 특징 비교" },
      { number: 3, answer: "①", wrongRate: null, preview: "생산 측면 외부효과와 사회적 최적 거래량 판단" },
      { number: 4, answer: "④", wrongRate: null, preview: "암묵적 비용·기회비용을 고려한 합리적 선택" },
      { number: 5, answer: "③", wrongRate: null, preview: "AI 도입 여부에 따른 생산량과 이윤극대화 노동량" },
      { number: 6, answer: "⑤", wrongRate: null, preview: "수요·공급 변화에 따른 X재 시장 균형점 이동" },
      { number: 7, answer: "③", wrongRate: null, preview: "조세 부과 정책과 소비자·생산자 잉여 변화" },
      { number: 8, answer: "④", wrongRate: null, preview: "최대 지불용의·최소 요구금액과 시장균형 잉여" },
      { number: 9, answer: "④", wrongRate: null, preview: "보조금 지급과 최저가격제 비교" },
      { number: 10, answer: "③", wrongRate: null, preview: "총수요·총공급 변화가 물가·실질GDP에 미치는 영향" },
      { number: 11, answer: "④", wrongRate: 62.9, preview: "부가가치 생산 방식 GDP 계산" },
      { number: 12, answer: "②", wrongRate: 55.3, preview: "관세 부과와 보조금 지급 무역정책 비교" },
      { number: 13, answer: "④", wrongRate: null, preview: "단리·복리 예금의 원리금과 실질구매력 비교" },
      { number: 14, answer: "①", wrongRate: null, preview: "취업자·실업자·경제활동참가율 등 고용지표 해석" },
      { number: 15, answer: "②", wrongRate: 64.7, preview: "비교우위에 따른 특화와 교역의 이익 계산" },
      { number: 16, answer: "①", wrongRate: null, preview: "경제성장률·물가상승률 그래프와 GDP디플레이터 해석" },
      { number: 17, answer: "②", wrongRate: null, preview: "외환시장 균형점 이동 요인(수요·공급 변화)" },
      { number: 18, answer: "①", wrongRate: null, preview: "국제수지 항목별 흑자·적자 분석" },
      { number: 19, answer: "⑤", wrongRate: 51.2, preview: "경상소득·비경상소득과 처분가능소득 계산" },
      { number: 20, answer: "⑤", wrongRate: 51.2, preview: "환율 변동에 따른 금융상품 투자수익률 비교" },
    ],
  },
  null,
  2
);

function blankQuestions() {
  return Array.from({ length: 20 }, (_, i) => ({
    number: i + 1,
    answer: "",
    wrongRate: null,
    preview: "",
    status: null,
    bookmarked: false,
    hasImage: false,
  }));
}

function normalizeQuestions(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const byNum = {};
  arr.forEach((q) => {
    if (q && typeof q.number === "number") byNum[q.number] = q;
  });
  return Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    const src = byNum[n] || {};
    return {
      number: n,
      answer: src.answer || "",
      wrongRate: typeof src.wrongRate === "number" ? src.wrongRate : null,
      preview: src.preview || "",
      status: null,
      bookmarked: false,
      hasImage: false,
    };
  });
}

function wrongRateColor(rate) {
  if (rate == null) return { bg: "#EFEBE3", fg: "#8A8378", label: "미상" };
  if (rate >= 55) return { bg: "#C1392B", fg: "#FFFFFF", label: `${rate}%` };
  if (rate >= 40) return { bg: "#E0836F", fg: "#FFFFFF", label: `${rate}%` };
  return { bg: "#EFDCD5", fg: "#8A4A3B", label: `${rate}%` };
}

function resizeImageFile(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          } else {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Bubble({ status, onClick }) {
  return (
    <button
      onClick={onClick}
      className="omr-bubble"
      style={{
        borderColor:
          status === "correct" ? "#2C4A6E" : status === "wrong" ? "#C1392B" : "#B9B2A4",
        background: status ? "#FFFFFF" : "#FDFBF6",
      }}
      title="클릭하여 정답/오답/미채점 순환"
    >
      {status === "correct" && (
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path
            d="M4 13 L10 19 L20 5"
            stroke="#2C4A6E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {status === "wrong" && (
        <svg viewBox="0 0 24 24" width="20" height="20" style={{ transform: "rotate(-4deg)" }}>
          <path d="M5 5 L19 19" stroke="#C1392B" strokeWidth="3" strokeLinecap="round" />
          <path d="M19 5 L5 19" stroke="#C1392B" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

const RENDER_WIDTH = 740;

function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function PdfCropTool({ examId, onClose, onSave }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const pdfRef = useRef(null);
  const fileRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [targetNumber, setTargetNumber] = useState(1);
  const [savedNumbers, setSavedNumbers] = useState([]);
  const [dragStart, setDragStart] = useState(null);
  const [dragRect, setDragRect] = useState(null);
  const [rendering, setRendering] = useState(false);

  async function handleFilePick(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setStatus("loading");
    try {
      const pdfjsLib = await loadPdfJs();
      const buf = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      pdfRef.current = doc;
      setNumPages(doc.numPages);
      setPageNum(1);
      setStatus("ready");
      await renderPage(doc, 1);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  async function renderPage(doc, num) {
    setRendering(true);
    try {
      const page = await doc.getPage(num);
      const natural = page.getViewport({ scale: 1 });
      const scale = RENDER_WIDTH / natural.width;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      overlay.width = viewport.width;
      overlay.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
      clearOverlay();
    } catch (err) {
      console.error(err);
    } finally {
      setRendering(false);
    }
  }

  function clearOverlay() {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }

  function goPage(delta) {
    const next = pageNum + delta;
    if (next < 1 || next > numPages || !pdfRef.current) return;
    setPageNum(next);
    renderPage(pdfRef.current, next);
  }

  function getPos(e) {
    const rect = overlayRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onMouseDown(e) {
    setDragStart(getPos(e));
    setDragRect(null);
  }

  function onMouseMove(e) {
    if (!dragStart) return;
    const cur = getPos(e);
    const x = Math.min(dragStart.x, cur.x);
    const y = Math.min(dragStart.y, cur.y);
    const w = Math.abs(cur.x - dragStart.x);
    const h = Math.abs(cur.y - dragStart.y);
    setDragRect({ x, y, w, h });
    const ctx = overlayRef.current.getContext("2d");
    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    ctx.strokeStyle = "#C1392B";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(193,57,43,0.08)";
    ctx.fillRect(x, y, w, h);
  }

  function onMouseUp() {
    setDragStart(null);
  }

  function saveCurrentCrop() {
    if (!dragRect || dragRect.w < 8 || dragRect.h < 8) return;
    const src = canvasRef.current;
    const out = document.createElement("canvas");
    out.width = Math.round(dragRect.w);
    out.height = Math.round(dragRect.h);
    const ctx = out.getContext("2d");
    ctx.drawImage(
      src,
      Math.round(dragRect.x),
      Math.round(dragRect.y),
      Math.round(dragRect.w),
      Math.round(dragRect.h),
      0,
      0,
      Math.round(dragRect.w),
      Math.round(dragRect.h)
    );
    const dataUrl = out.toDataURL("image/jpeg", 0.82);
    onSave(targetNumber, dataUrl);
    setSavedNumbers((s) => Array.from(new Set([...s, targetNumber])));
    setDragRect(null);
    clearOverlay();
    setTargetNumber((n) => Math.min(20, n + 1));
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="serif" style={{ fontSize: 19, fontWeight: 800 }}>
            <Scissors size={16} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            PDF에서 문제 잘라내기
          </div>
          <button className="btn-ghost btn" onClick={onClose}><X size={16} /></button>
        </div>

        {status === "idle" && (
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
              시험지 PDF를 선택하면 여기서 바로 열려. 파일은 네 브라우저 안에서만 처리되고
              어디로도 전송되지 않아.
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={handleFilePick}
              className="field"
              style={{ padding: 8 }}
            />
          </div>
        )}

        {status === "loading" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-soft)", padding: 20 }}>
            <Loader2 size={18} className="spin" /> PDF 불러오는 중...
          </div>
        )}

        {status === "error" && (
          <div style={{ color: "var(--red)", fontSize: 13 }}>
            PDF를 여는 데 실패했어. 다른 파일로 다시 시도해봐.
          </div>
        )}

        {status === "ready" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <button className="btn btn-ghost" onClick={() => goPage(-1)} disabled={pageNum <= 1 || rendering}>
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontSize: 13 }} className="mono">{pageNum} / {numPages} 페이지</span>
              <button className="btn btn-ghost" onClick={() => goPage(1)} disabled={pageNum >= numPages || rendering}>
                <ChevronRight size={15} />
              </button>

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>저장할 번호</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                  className="field mono"
                  style={{ width: 60, padding: "6px 8px" }}
                />
                <button className="btn btn-primary" onClick={saveCurrentCrop} disabled={!dragRect}>
                  이 번호로 저장
                </button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 8 }}>
              문제 영역을 마우스로 드래그해서 박스를 그은 다음 "이 번호로 저장"을 눌러줘. 저장하면 번호가 자동으로 다음으로 넘어가.
              {savedNumbers.length > 0 && (
                <span style={{ marginLeft: 8, color: "var(--blue)", fontWeight: 700 }}>
                  저장됨: {savedNumbers.sort((a, b) => a - b).join(", ")}
                </span>
              )}
            </div>

            <div
              style={{
                position: "relative",
                border: "1px solid var(--paper-line)",
                borderRadius: 8,
                overflow: "auto",
                maxHeight: "60vh",
                lineHeight: 0,
              }}
            >
              <canvas ref={canvasRef} style={{ display: "block" }} />
              <canvas
                ref={overlayRef}
                style={{ position: "absolute", top: 0, left: 0, cursor: "crosshair" }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn btn-primary" onClick={onClose}>
                <Check size={16} /> 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EconExamTracker() {
  const [exams, setExams] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [view, setView] = useState("dashboard"); // dashboard | exam | review
  const [currentId, setCurrentId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [parseError, setParseError] = useState("");
  const [imageCache, setImageCache] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [showCropTool, setShowCropTool] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setExams(parsed.map((e) => ({ subject: e.subject || "경제", ...e })));
        }
      } catch (e) {
        // no existing data yet
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setExams(next);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(next), false);
    } catch (e) {
      console.error("저장 실패", e);
    }
  }, []);

  const examsInSubject = useMemo(
    () => exams.filter((e) => (e.subject || "경제") === subject),
    [exams, subject]
  );

  const currentExam = useMemo(
    () => exams.find((e) => e.id === currentId) || null,
    [exams, currentId]
  );

  const bookmarkedList = useMemo(() => {
    const out = [];
    examsInSubject.forEach((e) => {
      e.questions.forEach((q) => {
        if (q.bookmarked) out.push({ examId: e.id, examTitle: e.title, ...q });
      });
    });
    return out;
  }, [examsInSubject]);

  useEffect(() => {
    if (view === "exam" && currentExam) {
      currentExam.questions.forEach((q) => {
        if (q.hasImage) {
          const key = `${currentExam.id}:${q.number}`;
          if (!imageCache[key]) {
            window.storage
              .get(`qimg:${currentExam.id}:${q.number}`, false)
              .then((res) => {
                if (res && res.value) setImageCache((c) => ({ ...c, [key]: res.value }));
              })
              .catch(() => {});
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, currentExam]);

  useEffect(() => {
    if (view === "review") {
      bookmarkedList.forEach((q) => {
        if (q.hasImage) {
          const key = `${q.examId}:${q.number}`;
          if (!imageCache[key]) {
            window.storage
              .get(`qimg:${q.examId}:${q.number}`, false)
              .then((res) => {
                if (res && res.value) setImageCache((c) => ({ ...c, [key]: res.value }));
              })
              .catch(() => {});
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, bookmarkedList]);

  function openAddModal() {
    setTitleInput("");
    setDateInput("");
    setJsonInput("");
    setParseError("");
    setShowAdd(true);
  }

  function createExam(withJson) {
    if (!titleInput.trim()) {
      setParseError("시험 제목을 입력해줘.");
      return;
    }
    let questions = blankQuestions();
    if (withJson && jsonInput.trim()) {
      try {
        const parsed = JSON.parse(jsonInput);
        const qArr = Array.isArray(parsed) ? parsed : parsed.questions;
        questions = normalizeQuestions(qArr);
      } catch (e) {
        setParseError("JSON 형식이 올바르지 않아. 형식을 다시 확인해줘.");
        return;
      }
    }
    const newExam = {
      id: `${Date.now()}`,
      subject,
      title: titleInput.trim(),
      date: dateInput.trim(),
      questions,
    };
    persist([newExam, ...exams]);
    setShowAdd(false);
    setCurrentId(newExam.id);
    setView("exam");
  }

  function deleteExam(id) {
    persist(exams.filter((e) => e.id !== id));
    if (currentId === id) {
      setCurrentId(null);
      setView("dashboard");
    }
  }

  function cycleStatus(examId, qNumber) {
    const next = exams.map((e) => {
      if (e.id !== examId) return e;
      return {
        ...e,
        questions: e.questions.map((q) => {
          if (q.number !== qNumber) return q;
          const order = [null, "correct", "wrong"];
          const idx = order.indexOf(q.status);
          const nextStatus = order[(idx + 1) % order.length];
          return { ...q, status: nextStatus };
        }),
      };
    });
    persist(next);
  }

  function toggleBookmark(examId, qNumber) {
    const next = exams.map((e) => {
      if (e.id !== examId) return e;
      return {
        ...e,
        questions: e.questions.map((q) =>
          q.number === qNumber ? { ...q, bookmarked: !q.bookmarked } : q
        ),
      };
    });
    persist(next);
  }

  function triggerUpload(examId, number) {
    setUploadTarget({ examId, number });
    requestAnimationFrame(() => {
      if (fileInputRef.current) fileInputRef.current.click();
    });
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !uploadTarget) return;
    const { examId, number } = uploadTarget;
    resizeImageFile(file)
      .then((dataUrl) => storeImage(examId, number, dataUrl))
      .catch(() => {});
  }

  async function storeImage(examId, number, dataUrl) {
    try {
      await window.storage.set(`qimg:${examId}:${number}`, dataUrl, false);
    } catch (e) {
      console.error("이미지 저장 실패", e);
      return;
    }
    setImageCache((c) => ({ ...c, [`${examId}:${number}`]: dataUrl }));
    const next = exams.map((ex) =>
      ex.id === examId
        ? {
            ...ex,
            questions: ex.questions.map((q) =>
              q.number === number ? { ...q, hasImage: true } : q
            ),
          }
        : ex
    );
    persist(next);
  }

  async function deleteImage(examId, number) {
    try {
      await window.storage.delete(`qimg:${examId}:${number}`, false);
    } catch (e) {
      // ignore
    }
    setImageCache((c) => {
      const n = { ...c };
      delete n[`${examId}:${number}`];
      return n;
    });
    const next = exams.map((ex) =>
      ex.id === examId
        ? {
            ...ex,
            questions: ex.questions.map((q) =>
              q.number === number ? { ...q, hasImage: false } : q
            ),
          }
        : ex
    );
    persist(next);
  }

  return (
    <div className="econ-tracker">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700;900&family=Noto+Sans+KR:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap');
        .econ-tracker {
          --paper: #FAF7F1;
          --paper-line: #E4DDCE;
          --ink: #211E1A;
          --ink-soft: #6B6558;
          --blue: #2C4A6E;
          --red: #C1392B;
          --gold: #B8934A;
          font-family: 'Noto Sans KR', sans-serif;
          background: var(--paper);
          background-image: linear-gradient(var(--paper-line) 1px, transparent 1px);
          background-size: 100% 42px;
          color: var(--ink);
          min-height: 100vh;
          padding: 28px 20px 60px;
        }
        .serif { font-family: 'Noto Serif KR', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .stamp {
          border: 2.5px solid var(--red);
          color: var(--red);
          border-radius: 999px;
          padding: 3px 12px;
          font-weight: 700;
          font-size: 12px;
          transform: rotate(-6deg);
          display: inline-block;
        }
        .card {
          background: #fff;
          border: 1px solid var(--paper-line);
          border-radius: 10px;
          box-shadow: 0 1px 0 rgba(33,30,26,0.04);
        }
        .btn {
          font-family: 'Noto Sans KR', sans-serif;
          font-weight: 600;
          border-radius: 8px;
          padding: 10px 16px;
          cursor: pointer;
          border: none;
          transition: transform 0.12s ease, opacity 0.12s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn:active { transform: scale(0.97); }
        .btn-primary { background: var(--blue); color: #fff; }
        .btn-primary:hover { opacity: 0.92; }
        .btn-ghost { background: transparent; color: var(--ink-soft); border: 1px solid var(--paper-line); }
        .btn-ghost:hover { background: #F3EEE3; }
        .btn-danger { background: transparent; color: var(--red); }
        .exam-row {
          display: grid;
          grid-template-columns: 44px 64px 1fr 90px 60px;
          gap: 12px;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid var(--paper-line);
        }
        .exam-row:last-child { border-bottom: none; }
        .omr-bubble {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: #FDFBF6;
          transition: transform 0.12s ease;
        }
        .omr-bubble:hover { transform: scale(1.06); }
        .flag-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: var(--paper-line);
        }
        .flag-btn.active { color: var(--gold); }
        .flag-btn:hover { background: #F3EEE3; }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(33,30,26,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 20px;
        }
        .modal {
          background: #fff;
          border-radius: 12px;
          max-width: 640px;
          width: 100%;
          max-height: 88vh;
          overflow-y: auto;
          padding: 24px;
        }
        input.field, textarea.field {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          padding: 10px 12px;
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 14px;
          box-sizing: border-box;
        }
        textarea.field { font-family: 'JetBrains Mono', monospace; font-size: 12px; min-height: 180px; }
        .nav-tab {
          padding: 8px 4px;
          margin-right: 22px;
          cursor: pointer;
          font-weight: 700;
          border-bottom: 3px solid transparent;
          color: var(--ink-soft);
        }
        .nav-tab.active { color: var(--ink); border-bottom-color: var(--blue); }
        .thumb {
          width: 64px;
          height: 44px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid var(--paper-line);
          cursor: pointer;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div className="stamp">채점 완료</div>
            <h1 className="serif" style={{ fontSize: 30, fontWeight: 900, margin: "6px 0 2px" }}>
              모의고사 풀이 트래커
            </h1>
            <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{subject} 모의고사 오답 분석 · 복습 보관함</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {SUBJECTS.map((s) => (
            <button
              key={s}
              className="btn"
              onClick={() => {
                setSubject(s);
                setView("dashboard");
                setCurrentId(null);
              }}
              style={{
                background: subject === s ? "var(--ink)" : "#fff",
                color: subject === s ? "#fff" : "var(--ink-soft)",
                border: "1px solid " + (subject === s ? "var(--ink)" : "var(--paper-line)"),
                padding: "8px 16px",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--paper-line)", margin: "18px 0 20px" }}>
          <div className={`nav-tab ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>
            시험 목록
          </div>
          <div className={`nav-tab ${view === "review" ? "active" : ""}`} onClick={() => setView("review")}>
            다시 풀 문제함 {bookmarkedList.length > 0 ? `(${bookmarkedList.length})` : ""}
          </div>
        </div>

        {!loaded && <div style={{ color: "var(--ink-soft)" }}>불러오는 중...</div>}

        {loaded && view === "dashboard" && (
          <div>
            <button className="btn btn-primary" onClick={openAddModal} style={{ marginBottom: 18 }}>
              <Plus size={16} /> 새 모의고사 추가
            </button>

            {examsInSubject.length === 0 && (
              <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--ink-soft)" }}>
                <ClipboardList size={28} style={{ marginBottom: 8 }} />
                <div>아직 등록된 {subject} 모의고사가 없어. 위 버튼으로 첫 시험을 추가해봐.</div>
              </div>
            )}

            <div style={{ display: "grid", gap: 12 }}>
              {examsInSubject.map((e) => {
                const answered = e.questions.filter((q) => q.status).length;
                const correct = e.questions.filter((q) => q.status === "correct").length;
                return (
                  <div key={e.id} className="card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ cursor: "pointer" }} onClick={() => { setCurrentId(e.id); setView("exam"); }}>
                      <div className="serif" style={{ fontWeight: 700, fontSize: 17 }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                        {e.date || "날짜 미입력"} · 채점 {answered}/20 · 정답 {correct}개
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => { setCurrentId(e.id); setView("exam"); }}>열기</button>
                      <button className="btn btn-danger" onClick={() => deleteExam(e.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loaded && view === "exam" && currentExam && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button className="btn btn-ghost" onClick={() => setView("dashboard")}>
                <ChevronLeft size={16} /> 목록으로
              </button>
              <button className="btn btn-primary" onClick={() => setShowCropTool(true)}>
                <Scissors size={15} /> PDF에서 한 번에 자르기
              </button>
            </div>

            <div className="card" style={{ padding: "20px 8px" }}>
              <div style={{ padding: "0 18px 14px", borderBottom: "1px solid var(--paper-line)" }}>
                <div className="serif" style={{ fontSize: 20, fontWeight: 900 }}>{currentExam.title}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{currentExam.date || "날짜 미입력"}</div>
              </div>

              <div className="exam-row" style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700, borderBottom: "1px solid var(--paper-line)" }}>
                <div>번호</div>
                <div>오답률</div>
                <div>문제 보기</div>
                <div style={{ textAlign: "center" }}>정오</div>
                <div style={{ textAlign: "center" }}>보관</div>
              </div>

              {currentExam.questions.map((q) => {
                const wr = wrongRateColor(q.wrongRate);
                const imgKey = `${currentExam.id}:${q.number}`;
                const imgSrc = imageCache[imgKey];
                return (
                  <div className="exam-row" key={q.number}>
                    <div className="mono" style={{ fontWeight: 700 }}>{q.number}</div>
                    <div>
                      <span style={{ background: wr.bg, color: wr.fg, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>
                        {wr.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.4 }}>
                        {q.preview || <span style={{ color: "var(--ink-soft)" }}>문제 요약 미입력</span>}
                        <span className="mono" style={{ marginLeft: 8, color: "var(--ink-soft)", fontSize: 12 }}>
                          정답 {q.answer || "?"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {q.hasImage ? (
                          <>
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                className="thumb"
                                alt={`${q.number}번 문제`}
                                onClick={() => setLightbox(imgSrc)}
                              />
                            ) : (
                              <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>이미지 불러오는 중...</span>
                            )}
                            <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => triggerUpload(currentExam.id, q.number)}>
                              교체
                            </button>
                            <button className="btn btn-danger" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => deleteImage(currentExam.id, q.number)}>
                              삭제
                            </button>
                          </>
                        ) : (
                          <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => triggerUpload(currentExam.id, q.number)}>
                            <ImagePlus size={13} /> 문제 이미지 첨부
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Bubble status={q.status} onClick={() => cycleStatus(currentExam.id, q.number)} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <button
                        className={`flag-btn ${q.bookmarked ? "active" : ""}`}
                        onClick={() => toggleBookmark(currentExam.id, q.number)}
                        title="다시 풀 문제로 보관"
                      >
                        <Flag size={18} fill={q.bookmarked ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loaded && view === "review" && (
          <div>
            <div style={{ marginBottom: 14, color: "var(--ink-soft)", fontSize: 13 }}>
              <BookMarked size={15} style={{ verticalAlign: "-2px", marginRight: 5 }} />
              깃발을 눌러 보관한 문제들이야. 다시 풀어본 뒤엔 깃발을 눌러 해제해줘.
            </div>
            {bookmarkedList.length === 0 && (
              <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--ink-soft)" }}>
                아직 보관한 문제가 없어.
              </div>
            )}
            <div style={{ display: "grid", gap: 10 }}>
              {bookmarkedList.map((q) => {
                const imgKey = `${q.examId}:${q.number}`;
                const imgSrc = imageCache[imgKey];
                return (
                  <div key={imgKey} className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {q.hasImage && imgSrc && (
                        <img src={imgSrc} className="thumb" alt={`${q.number}번 문제`} onClick={() => setLightbox(imgSrc)} />
                      )}
                      <div>
                        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>{q.examTitle}</div>
                        <div style={{ fontWeight: 700 }} className="mono">{q.number}번</div>
                        <div style={{ fontSize: 13.5, marginTop: 2 }}>{q.preview}</div>
                      </div>
                    </div>
                    <button className="flag-btn active" onClick={() => toggleBookmark(q.examId, q.number)}>
                      <Flag size={18} fill="currentColor" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div className="serif" style={{ fontSize: 19, fontWeight: 800 }}>새 모의고사 추가</div>
              <button className="btn-ghost btn" onClick={() => setShowAdd(false)}><X size={16} /></button>
            </div>

            <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700 }}>시험 제목</label>
                <input className="field" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder="예: 2027학년도 6월 모의평가 - 경제" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700 }}>시행일 (선택)</label>
                <input className="field" value={dateInput} onChange={(e) => setDateInput(e.target.value)} placeholder="2026-06" />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700 }}>
                <FileJson2 size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                문항 JSON (Claude에게 시험지·정답·오답률 캡처를 주면 만들어줘)
              </label>
              <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setJsonInput(SAMPLE_JSON)}>
                <Sparkles size={13} /> 예시 불러오기
              </button>
            </div>
            <textarea
              className="field"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"questions":[{"number":1,"answer":"⑤","wrongRate":null,"preview":"..."}, ...]}'
            />
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
              JSON을 비워두면 20문항 빈 칸으로 생성돼. 문제 이미지는 만든 후 각 행에서 바로 첨부할 수 있어.
            </div>

            {parseError && <div style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{parseError}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>취소</button>
              <button className="btn btn-primary" onClick={() => createExam(true)}>
                <Check size={16} /> 만들기
              </button>
            </div>
          </div>
        </div>
      )}

      {showCropTool && currentExam && (
        <PdfCropTool
          examId={currentExam.id}
          onClose={() => setShowCropTool(false)}
          onSave={(number, dataUrl) => storeImage(currentExam.id, number, dataUrl)}
        />
      )}

      {lightbox && (
        <div className="modal-backdrop" onClick={() => setLightbox(null)}>
          <img
            src={lightbox}
            style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 8, boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}
            onClick={(e) => e.stopPropagation()}
            alt="문제 확대 보기"
          />
        </div>
      )}
    </div>
  );
}
