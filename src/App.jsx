import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import {
  CheckCircle,
  Download,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Admin from "./Admin";

// ======================================================
// LOCAL STORAGE HOOK
// ======================================================

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch (error) {
      console.error(`LocalStorage read error for ${key}:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== key) return;

      try {
        if (event.newValue === null) {
          setValue(initialValue);
        } else {
          setValue(JSON.parse(event.newValue));
        }
      } catch (error) {
        console.error(`LocalStorage sync error for ${key}:`, error);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [key, initialValue]);

  const updateValue = (nextValue) => {
    try {
      const valueToStore =
        typeof nextValue === "function"
          ? nextValue(value)
          : nextValue;

      setValue(valueToStore);

      window.localStorage.setItem(
        key,
        JSON.stringify(valueToStore)
      );
    } catch (error) {
      console.error(`LocalStorage write error for ${key}:`, error);
    }
  };

  return [value, updateValue];
}

// ======================================================
// DEFAULT QUESTIONS
// ======================================================

const DEFAULT_QUESTIONS = {
  10: [
    {
      id: 1,
      q: "React uses which language?",
      opts: ["Java", "PHP", "JavaScript", "C++"],
      ans: 2,
    },
    {
      id: 2,
      q: "What is JSX?",
      opts: [
        "Style Sheet",
        "JavaScript XML",
        "Java Syntax",
        "Database",
      ],
      ans: 1,
    },
  ],

  15: [
    {
      id: 1,
      q: "Which keyword is used to declare a constant in JavaScript?",
      opts: ["var", "let", "const", "static"],
      ans: 2,
    },
    {
      id: 2,
      q: "Which hook is used to manage state in a React function component?",
      opts: ["useEffect", "useState", "useMemo", "useRef"],
      ans: 1,
    },
  ],

  20: [
    {
      id: 1,
      q: "What is the capital of France?",
      opts: ["Berlin", "Madrid", "Paris", "Rome"],
      ans: 2,
    },
    {
      id: 2,
      q: "Which data structure follows FIFO?",
      opts: ["Stack", "Queue", "Tree", "Graph"],
      ans: 1,
    },
  ],

  25: [
    {
      id: 1,
      q: "Which HTTP method is normally used to retrieve data?",
      opts: ["POST", "PUT", "GET", "DELETE"],
      ans: 2,
    },
    {
      id: 2,
      q: "Which database is a NoSQL database?",
      opts: ["MySQL", "Oracle", "MongoDB", "PostgreSQL"],
      ans: 2,
    },
  ],

  30: [
    {
      id: 1,
      q: "What does API stand for?",
      opts: [
        "Application Programming Interface",
        "Application Process Internet",
        "Advanced Programming Input",
        "Applied Program Interface",
      ],
      ans: 0,
    },
    {
      id: 2,
      q: "Which language is primarily used with Spring Boot?",
      opts: ["Java", "Python", "PHP", "Ruby"],
      ans: 0,
    },
  ],
};

// ======================================================
// MAIN APP
// ======================================================

const MainApp = () => {
  // ====================================================
  // APPLICATION STATE
  // ====================================================

  const [step, setStep] = useState("gate");

  const [accessCode, setAccessCode] = useState("");

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    duration: 10,
  });

  const [timeLeft, setTimeLeft] = useState(0);

  const [userAnswers, setUserAnswers] = useState({});

  const [score, setScore] = useState(0);

  // Prevent duplicate finishTest execution
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // ====================================================
  // LOCAL STORAGE
  // ====================================================

  const [validCodes, setValidCodes] = useLocalStorage(
    "mu_validCodes",
    ["APP#KID$", "TEST*QA#", "CODE@STR"]
  );

  const [usedCodes, setUsedCodes] = useLocalStorage(
    "mu_usedCodes",
    []
  );

  const [allSubmissions, setAllSubmissions] = useLocalStorage(
    "mu_submissions",
    []
  );

  const [adminSettings, setAdminSettings] = useLocalStorage(
    "mu_settings",
    {
      warningMinutes: 2,
    }
  );

  const [questionsBank, setQuestionsBank] = useLocalStorage(
    "mu_questions",
    DEFAULT_QUESTIONS
  );

  // ====================================================
  // NORMALIZE DURATION
  // ====================================================

  const selectedDuration = Number(user.duration);

  // ====================================================
  // CURRENT QUESTIONS
  // ====================================================

  const currentQuestions = useMemo(() => {
    return (
      questionsBank?.[selectedDuration] ||
      questionsBank?.[10] ||
      []
    );
  }, [questionsBank, selectedDuration]);

  // ====================================================
  // VALIDATION HELPERS
  // ====================================================

  const normalizeName = (value) => {
    return value
      .trim()
      .replace(/\s+/g, " ");
  };

  const normalizeEmail = (value) => {
    return value.trim().toLowerCase();
  };

  const normalizePhone = (value) => {
    return value.replace(/\D/g, "").slice(0, 10);
  };

  const isValidName = (name) => {
    if (!name) return false;

    if (name.length < 2) return false;

    /*
      Allows:
      Adarsh Kumar
      Rahul Singh
      O'Connor
      Mary-Jane

      Does not allow:
      12345
      @@@@@
      !!!
    */
    return /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]*$/.test(name);
  };

  const isValidEmail = (email) => {
    if (!email) return false;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone) => {
    return /^[0-9]{10}$/.test(phone);
  };

  // ====================================================
  // CANDIDATE DETAILS VALIDATION
  // ====================================================

  const candidateDetailsValid =
    isValidName(normalizeName(user.name)) &&
    isValidEmail(normalizeEmail(user.email)) &&
    isValidPhone(user.phone) &&
    [10, 15, 20, 25, 30].includes(selectedDuration) &&
    Array.isArray(currentQuestions) &&
    currentQuestions.length > 0;

  // ====================================================
  // ACCESS CODE VALIDATION
  // ====================================================

  const handleVerifyCode = () => {
    const code = accessCode.trim();

    if (!code) {
      alert("⚠️ Please enter your access code.");
      return;
    }

    if (!validCodes.includes(code)) {
      alert("❌ Invalid Access Code.");
      return;
    }

    if (usedCodes.includes(code)) {
      alert("⚠️ This Access Code has already been used.");
      return;
    }

    /*
      Reset candidate information whenever
      a new valid code opens the form.
    */
    setUser({
      name: "",
      email: "",
      phone: "",
      duration: 10,
    });

    setUserAnswers({});
    setScore(0);
    setTimeLeft(0);
    setHasSubmitted(false);

    setStep("form");
  };

  // ====================================================
  // START ASSESSMENT
  // ====================================================

  const handleStartAssessment = (event) => {
    event.preventDefault();

    /*
      HARD GUARD:
      The assessment can ONLY start from the candidate
      details form.
    */
    if (step !== "form") {
      return;
    }

    /*
      HARD GUARD:
      The access code must still be valid and unused.
    */
    const code = accessCode.trim();

    if (!code) {
      alert("⚠️ Access code is missing.");
      setStep("gate");
      return;
    }

    if (!validCodes.includes(code)) {
      alert("❌ Invalid Access Code.");
      setStep("gate");
      return;
    }

    if (usedCodes.includes(code)) {
      alert("⚠️ This Access Code has already been used.");
      setStep("gate");
      return;
    }

    // ==================================================
    // CLEAN USER DATA
    // ==================================================

    const name = normalizeName(user.name);
    const email = normalizeEmail(user.email);
    const phone = normalizePhone(user.phone);
    const duration = Number(user.duration);

    // ==================================================
    // NAME VALIDATION
    // ==================================================

    if (!name) {
      alert("⚠️ Full Name is required.");
      return;
    }

    if (!isValidName(name)) {
      alert("⚠️ Please enter a valid Full Name.");
      return;
    }

    // ==================================================
    // EMAIL VALIDATION
    // ==================================================

    if (!email) {
      alert("⚠️ Email Address is required.");
      return;
    }

    if (!isValidEmail(email)) {
      alert("⚠️ Please enter a valid Email Address.");
      return;
    }

    // ==================================================
    // PHONE VALIDATION
    // ==================================================

    if (!phone) {
      alert("⚠️ Phone Number is required.");
      return;
    }

    if (!isValidPhone(phone)) {
      alert(
        "⚠️ Phone Number must contain exactly 10 digits."
      );
      return;
    }

    // ==================================================
    // DURATION VALIDATION
    // ==================================================

    if (![10, 15, 20, 25, 30].includes(duration)) {
      alert("⚠️ Please select a valid Test Duration.");
      return;
    }

    // ==================================================
    // QUESTIONS VALIDATION
    // ==================================================

    const questionsForTest =
      questionsBank?.[duration] || [];

    if (
      !Array.isArray(questionsForTest) ||
      questionsForTest.length === 0
    ) {
      alert(
        "⚠️ No questions are available for this test."
      );
      return;
    }

    // ==================================================
    // FINAL CANDIDATE OBJECT
    // ==================================================

    const candidateData = {
      name,
      email,
      phone,
      duration,
    };

    // ==================================================
    // SAVE CLEAN DATA
    // ==================================================

    setUser(candidateData);

    // ==================================================
    // RESET TEST
    // ==================================================

    setUserAnswers({});
    setScore(0);
    setHasSubmitted(false);

    // IMPORTANT:
    // Use candidateData.duration instead of old state.
    setTimeLeft(duration * 60);

    // ==================================================
    // ONLY HERE CAN TEST START
    // ==================================================

    setStep("test");
  };

  // ====================================================
  // ANSWER QUESTION
  // ====================================================

  const handleAnswer = (questionIndex, optionIndex) => {
    if (step !== "test") return;

    if (hasSubmitted) return;

    setUserAnswers((previous) => ({
      ...previous,
      [questionIndex]: optionIndex,
    }));
  };

  // ====================================================
  // FINISH TEST
  // ====================================================

  const finishTest = () => {
    /*
      Prevent:
      - double clicking submit
      - timer + manual submit collision
      - duplicate localStorage submissions
    */
    if (step !== "test") {
      return;
    }

    if (hasSubmitted) {
      return;
    }

    setHasSubmitted(true);

    // ==================================================
    // CALCULATE SCORE
    // ==================================================

    let finalScore = 0;

    const detailedAnswers = currentQuestions.map(
      (question, index) => {
        const selectedAnswer = userAnswers[index];

        const isCorrect =
          selectedAnswer !== undefined &&
          selectedAnswer === question.ans;

        if (isCorrect) {
          finalScore++;
        }

        return {
          question: question.q,

          userAns:
            selectedAnswer !== undefined
              ? question.opts[selectedAnswer]
              : "Skipped",

          correctAns:
            question.opts[question.ans],

          isCorrect,
        };
      }
    );

    // ==================================================
    // UPDATE SCORE
    // ==================================================

    setScore(finalScore);

    // ==================================================
    // SUBMISSION DATA
    // ==================================================

    const submission = {
      name: user.name.trim(),
      email: user.email.trim(),
      phone: user.phone.trim(),
      duration: Number(user.duration),

      score: finalScore,
      total: currentQuestions.length,

      code: accessCode.trim(),

      time: new Date().toLocaleTimeString(),

      date: new Date().toLocaleDateString(),

      details: detailedAnswers,
    };

    // ==================================================
    // SAVE SUBMISSION
    // ==================================================

    setAllSubmissions((previous) => [
      submission,
      ...previous,
    ]);

    // ==================================================
    // MARK ACCESS CODE AS USED
    // ==================================================

    const submittedCode = accessCode.trim();

    setUsedCodes((previous) => {
      if (previous.includes(submittedCode)) {
        return previous;
      }

      return [...previous, submittedCode];
    });

    // ==================================================
    // SHOW RESULT
    // ==================================================

    setStep("result");
  };

  // ====================================================
  // TIMER
  // ====================================================

  useEffect(() => {
    if (step !== "test") {
      return;
    }

    if (hasSubmitted) {
      return;
    }

    if (timeLeft <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [step, hasSubmitted]);

  // ====================================================
  // AUTO SUBMIT
  // ====================================================

  useEffect(() => {
    if (
      step === "test" &&
      timeLeft === 0 &&
      !hasSubmitted
    ) {
      finishTest();
    }
  }, [timeLeft, step, hasSubmitted]);

  // ====================================================
  // TIMER WARNING
  // ====================================================

  useEffect(() => {
    if (step !== "test") {
      return;
    }

    if (hasSubmitted) {
      return;
    }

    const warningSeconds =
      Number(adminSettings?.warningMinutes || 0) * 60;

    if (
      warningSeconds > 0 &&
      timeLeft === warningSeconds
    ) {
      alert(
        `⏳ WARNING: Only ${adminSettings.warningMinutes} minutes left! Your test will be auto-submitted.`
      );
    }
  }, [
    timeLeft,
    step,
    hasSubmitted,
    adminSettings,
  ]);

  // ====================================================
  // FORMAT TIME
  // ====================================================

  const formattedMinutes = Math.floor(timeLeft / 60);

  const formattedSeconds = String(
    timeLeft % 60
  ).padStart(2, "0");

  // ====================================================
  // DOWNLOAD RESULT PDF
  // ====================================================

  const downloadPDF = () => {
    const doc = new jsPDF();

    const candidateName =
      user.name.trim() || "Candidate";

    doc.setFontSize(20);
    doc.text("EXAM RESULT", 20, 20);

    doc.setFontSize(12);

    doc.text(
      `Name: ${user.name}`,
      20,
      35
    );

    doc.text(
      `Email: ${user.email}`,
      20,
      45
    );

    doc.text(
      `Phone: ${user.phone}`,
      20,
      55
    );

    doc.text(
      `Test Duration: ${user.duration} Minutes`,
      20,
      65
    );

    doc.text(
      `Score: ${score} / ${currentQuestions.length}`,
      20,
      75
    );

    doc.text(
      `Access Code: ${accessCode}`,
      20,
      85
    );

    doc.text(
      `Date: ${new Date().toLocaleDateString()}`,
      20,
      95
    );

    if (
      typeof doc.autoTable === "function"
    ) {
      const rows = currentQuestions.map(
        (question, index) => {
          const selected =
            userAnswers[index];

          return [
            index + 1,
            question.q,
            selected !== undefined
              ? question.opts[selected]
              : "Skipped",
            question.opts[question.ans],
            selected === question.ans
              ? "Correct"
              : "Incorrect",
          ];
        }
      );

      doc.autoTable({
        startY: 110,
        head: [
          [
            "#",
            "Question",
            "Your Answer",
            "Correct Answer",
            "Result",
          ],
        ],
        body: rows,
        styles: {
          fontSize: 8,
        },
      });
    }

    const safeFileName = candidateName
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    doc.save(
      `${safeFileName || "Candidate"}_Result.pdf`
    );
  };

  // ====================================================
  // RESET APPLICATION
  // ====================================================

  const resetCandidateSession = () => {
    setAccessCode("");

    setUser({
      name: "",
      email: "",
      phone: "",
      duration: 10,
    });

    setTimeLeft(0);
    setUserAnswers({});
    setScore(0);
    setHasSubmitted(false);
    setStep("gate");
  };

  // ====================================================
  // GENERATE ACCESS CODE
  // ====================================================

  const generate8LetterCode = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$*&";

    return Array.from(
      { length: 8 },
      () =>
        chars.charAt(
          Math.floor(
            Math.random() * chars.length
          )
        )
    ).join("");
  };

  // ====================================================
  // UPDATE QUESTIONS
  // ====================================================

  const handleUpdateQuestions = (
    timeSlot,
    newQuestionsList
  ) => {
    setQuestionsBank((previous) => ({
      ...previous,
      [timeSlot]: Array.isArray(newQuestionsList)
        ? newQuestionsList
        : [],
    }));
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Routes>

      {/* ==================================================
          CANDIDATE PORTAL
      ================================================== */}

      <Route
        path="/"
        element={
          <div className="min-h-screen bg-[#F5F5F7] relative overflow-hidden font-sans">

            {/* BACKGROUND */}

            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-float" />

            <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-float-delayed" />

            {/* ==================================================
                ACCESS CODE SCREEN
            ================================================== */}

            {step === "gate" && (
              <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">

                <div className="text-center mb-10 animate-float">

                  <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-3xl mb-4 shadow-xl shadow-blue-200">
                    <GraduationCap
                      size={48}
                      className="text-white"
                    />
                  </div>

                  <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
                    STUDENT PORTAL
                  </h1>

                  <p className="text-gray-500 font-medium mt-2">
                    Secure Online Assessment Environment
                  </p>

                </div>

                <div className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 text-center border border-white">

                  <h2 className="text-2xl font-bold mb-8 text-[#1d1d1f]">
                    Candidate Verification
                  </h2>

                  <input
                    type="text"
                    placeholder="8-LETTER CODE"
                    value={accessCode}
                    autoComplete="off"
                    onChange={(event) => {
                      setAccessCode(
                        event.target.value
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleVerifyCode();
                      }
                    }}
                    className="w-full p-5 bg-[#F5F5F7] rounded-2xl text-center text-xl font-mono mb-6 outline-none focus:ring-2 ring-blue-500 transition-all uppercase"
                  />

                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={!accessCode.trim()}
                    className={`w-full py-5 rounded-2xl font-bold shadow-xl transition-all ${
                      accessCode.trim()
                        ? "bg-[#1d1d1f] text-white hover:bg-black"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Proceed to Form
                  </button>

                </div>

              </div>
            )}

            {/* ==================================================
                CANDIDATE DETAILS
            ================================================== */}

            {step === "form" && (
              <div className="min-h-screen flex items-center justify-center p-6 relative z-10">

                <div className="max-w-xl w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">

                  <div className="mb-8">

                    <h2 className="text-3xl font-black mb-2 text-[#1d1d1f]">
                      Candidate Details
                    </h2>

                    <p className="text-gray-500 font-medium">
                      All fields are mandatory before starting the assessment.
                    </p>

                  </div>

                  {/* ==================================================
                      ONLY ONE FORM
                  ================================================== */}

                  <form
                    onSubmit={handleStartAssessment}
                    noValidate
                    className="space-y-5"
                  >

                    {/* FULL NAME */}

                    <div>

                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Full Name *
                      </label>

                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={user.name}
                        autoComplete="name"
                        onChange={(event) => {
                          setUser((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }));
                        }}
                        className={`w-full p-4 bg-[#F5F5F7] rounded-2xl outline-none focus:ring-2 ring-blue-500 ${
                          user.name &&
                          !isValidName(
                            normalizeName(user.name)
                          )
                            ? "ring-2 ring-red-400"
                            : ""
                        }`}
                      />

                      {user.name &&
                        !isValidName(
                          normalizeName(user.name)
                        ) && (
                          <p className="text-red-500 text-xs font-medium mt-2">
                            Please enter a valid full name.
                          </p>
                        )}

                    </div>

                    {/* EMAIL */}

                    <div>

                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email Address *
                      </label>

                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={user.email}
                        autoComplete="email"
                        onChange={(event) => {
                          setUser((previous) => ({
                            ...previous,
                            email: event.target.value,
                          }));
                        }}
                        className={`w-full p-4 bg-[#F5F5F7] rounded-2xl outline-none focus:ring-2 ring-blue-500 ${
                          user.email &&
                          !isValidEmail(
                            normalizeEmail(user.email)
                          )
                            ? "ring-2 ring-red-400"
                            : ""
                        }`}
                      />

                      {user.email &&
                        !isValidEmail(
                          normalizeEmail(user.email)
                        ) && (
                          <p className="text-red-500 text-xs font-medium mt-2">
                            Please enter a valid email address.
                          </p>
                        )}

                    </div>

                    {/* DURATION + PHONE */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {/* DURATION */}

                      <div>

                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Test Duration *
                        </label>

                        <select
                          value={user.duration}
                          onChange={(event) => {
                            setUser((previous) => ({
                              ...previous,
                              duration: Number(
                                event.target.value
                              ),
                            }));
                          }}
                          className="w-full p-4 bg-[#F5F5F7] rounded-2xl outline-none cursor-pointer focus:ring-2 ring-blue-500"
                        >
                          <option value="10">
                            10 Mins Test
                          </option>

                          <option value="15">
                            15 Mins Test
                          </option>

                          <option value="20">
                            20 Mins Test
                          </option>

                          <option value="25">
                            25 Mins Test
                          </option>

                          <option value="30">
                            30 Mins Test
                          </option>
                        </select>

                      </div>

                      {/* PHONE */}

                      <div>

                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Phone Number *
                        </label>

                        <input
                          type="tel"
                          placeholder="10 digit phone number"
                          value={user.phone}
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={10}
                          onChange={(event) => {
                            const phone =
                              normalizePhone(
                                event.target.value
                              );

                            setUser((previous) => ({
                              ...previous,
                              phone,
                            }));
                          }}
                          className={`w-full p-4 bg-[#F5F5F7] rounded-2xl outline-none focus:ring-2 ring-blue-500 ${
                            user.phone &&
                            !isValidPhone(user.phone)
                              ? "ring-2 ring-red-400"
                              : ""
                          }`}
                        />

                        {user.phone &&
                          !isValidPhone(user.phone) && (
                            <p className="text-red-500 text-xs font-medium mt-2">
                              Enter exactly 10 digits.
                            </p>
                          )}

                      </div>

                    </div>

                    {/* QUESTIONS STATUS */}

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">

                      <div className="flex justify-between items-center">

                        <span className="text-sm font-semibold text-gray-600">
                          Questions Available
                        </span>

                        <span
                          className={`font-bold ${
                            currentQuestions.length > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {currentQuestions.length}
                        </span>

                      </div>

                    </div>

                    {/* ==================================================
                        START BUTTON
                        DISABLED UNTIL EVERYTHING IS VALID
                    ================================================== */}

                    <button
                      type="submit"
                      disabled={!candidateDetailsValid}
                      className={`w-full py-5 rounded-2xl font-bold mt-4 flex justify-center items-center gap-2 transition-all ${
                        candidateDetailsValid
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {candidateDetailsValid
                        ? "Start Assessment"
                        : "Complete All Details"}

                      <ChevronRight size={20} />

                    </button>

                    {/* BACK */}

                    <button
                      type="button"
                      onClick={resetCandidateSession}
                      className="w-full py-3 text-gray-500 font-semibold hover:text-gray-800 transition-all"
                    >
                      ← Change Access Code
                    </button>

                  </form>

                </div>

              </div>
            )}

            {/* ==================================================
                TEST
            ================================================== */}

            {step === "test" && (
              <div className="min-h-screen py-10 px-6 relative z-10">

                <div className="max-w-3xl mx-auto">

                  {/* HEADER */}

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm sticky top-5 z-20 border border-white">

                    <div>

                      <span className="font-black tracking-widest text-blue-600">
                        LIVE EXAM
                      </span>

                      <p className="text-sm text-gray-500 mt-1">
                        Candidate: {user.name}
                      </p>

                    </div>

                    <div
                      className={`font-mono px-5 py-3 rounded-xl font-bold transition-all ${
                        timeLeft <=
                        Number(
                          adminSettings?.warningMinutes || 0
                        ) *
                          60
                          ? "bg-red-100 text-red-600 animate-pulse"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {formattedMinutes}:
                      {formattedSeconds} Left
                    </div>

                  </div>

                  {/* QUESTIONS */}

                  {currentQuestions.map(
                    (question, index) => (
                      <div
                        key={
                          question.id ??
                          index
                        }
                        className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-8 border border-white"
                      >

                        <h3 className="text-xl font-bold mb-6 text-[#1d1d1f] leading-relaxed">

                          <span className="text-gray-400 mr-2">
                            {index + 1}.
                          </span>

                          {question.q}

                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">

                          {question.opts.map(
                            (option, optionIndex) => (
                              <button
                                key={optionIndex}
                                type="button"
                                disabled={hasSubmitted}
                                onClick={() =>
                                  handleAnswer(
                                    index,
                                    optionIndex
                                  )
                                }
                                className={`w-full p-5 text-left rounded-2xl border-2 transition-all font-medium ${
                                  userAnswers[index] ===
                                  optionIndex
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-transparent bg-[#F5F5F7] text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {option}
                              </button>
                            )
                          )}

                        </div>

                      </div>
                    )
                  )}

                  {/* SUBMIT */}

                  <button
                    type="button"
                    disabled={hasSubmitted}
                    onClick={finishTest}
                    className={`w-full py-5 rounded-2xl font-bold shadow-xl transition-all ${
                      hasSubmitted
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-[#1d1d1f] text-white hover:bg-black"
                    }`}
                  >
                    {hasSubmitted
                      ? "Submitting..."
                      : "Submit My Responses"}
                  </button>

                </div>

              </div>
            )}

            {/* ==================================================
                RESULT
            ================================================== */}

            {step === "result" && (
              <div className="min-h-screen flex items-center justify-center p-6 relative z-10">

                <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[3rem] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">

                  <CheckCircle
                    size={60}
                    className="text-green-500 mx-auto mb-6"
                  />

                  <h2 className="text-3xl font-black mb-2 text-[#1d1d1f]">
                    All Done!
                  </h2>

                  <p className="text-gray-500 mb-8">
                    Your assessment has been submitted successfully.
                  </p>

                  {/* CANDIDATE DETAILS */}

                  <div className="text-left bg-gray-50 p-6 rounded-3xl mb-6 space-y-3">

                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase">
                        Name
                      </span>

                      <p className="font-semibold text-gray-800">
                        {user.name}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase">
                        Email
                      </span>

                      <p className="font-semibold text-gray-800 break-all">
                        {user.email}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase">
                        Phone
                      </span>

                      <p className="font-semibold text-gray-800">
                        {user.phone}
                      </p>
                    </div>

                  </div>

                  {/* SCORE */}

                  <div className="bg-[#F5F5F7] p-10 rounded-[2.5rem] mb-8">

                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Final Score
                    </p>

                    <h1 className="text-6xl font-black text-blue-600">

                      {score}

                      <span className="text-2xl text-gray-300">
                        /{currentQuestions.length}
                      </span>

                    </h1>

                  </div>

                  {/* DOWNLOAD */}

                  <button
                    type="button"
                    onClick={downloadPDF}
                    className="w-full py-5 bg-[#1d1d1f] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl"
                  >
                    <Download size={20} />
                    Download Report
                  </button>

                  {/* END SESSION */}

                  <button
                    type="button"
                    onClick={resetCandidateSession}
                    className="w-full py-4 mt-4 text-gray-500 font-semibold hover:text-gray-800 transition-all"
                  >
                    Finish
                  </button>

                </div>

              </div>
            )}

          </div>
        }
      />

      {/* ==================================================
          ADMIN ROUTE
      ================================================== */}

      <Route
        path="/admin"
        element={
          <Admin
            validCodes={validCodes}

            onAddCode={() => {
              let newCode = generate8LetterCode();

              /*
                Avoid accidental duplicate generated codes.
              */
              while (
                validCodes.includes(newCode)
              ) {
                newCode = generate8LetterCode();
              }

              setValidCodes((previous) => [
                ...previous,
                newCode,
              ]);
            }}

            usedCodes={usedCodes}

            allSubmissions={allSubmissions}

            questionsBank={questionsBank}

            onUpdateQuestions={
              handleUpdateQuestions
            }

            adminSettings={adminSettings}

            setAdminSettings={
              setAdminSettings
            }
          />
        }
      />

    </Routes>
  );
};

export default MainApp;

