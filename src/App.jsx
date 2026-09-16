```jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  CheckCircle,
  Download,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Admin from './Admin';

// ======================================================
// LOCAL STORAGE HOOK
// ======================================================

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      window.localStorage.setItem(
        key,
        JSON.stringify(valueToStore)
      );
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// ======================================================
// MAIN APP
// ======================================================

const MainApp = () => {

  // ====================================================
  // MAIN STATES
  // ====================================================

  const [step, setStep] = useState('gate');

  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    duration: 10
  });

  const [timeLeft, setTimeLeft] = useState(0);

  const [accessCode, setAccessCode] = useState('');

  const [userAnswers, setUserAnswers] = useState({});

  const [score, setScore] = useState(0);

  // ====================================================
  // GLOBAL STATES
  // ====================================================

  const [validCodes, setValidCodes] = useLocalStorage(
    'mu_validCodes',
    [
      'APP#KID$',
      'TEST*QA#',
      'CODE@STR'
    ]
  );

  const [usedCodes, setUsedCodes] = useLocalStorage(
    'mu_usedCodes',
    []
  );

  const [allSubmissions, setAllSubmissions] = useLocalStorage(
    'mu_submissions',
    []
  );

  const [adminSettings, setAdminSettings] = useLocalStorage(
    'mu_settings',
    {
      warningMinutes: 2
    }
  );

  const [questionsBank, setQuestionsBank] = useLocalStorage(
    'mu_questions',
    {
      10: [
        {
          id: 1,
          q: 'React uses which language?',
          opts: [
            'Java',
            'PHP',
            'JavaScript',
            'C++'
          ],
          ans: 2
        },
        {
          id: 2,
          q: 'What is JSX?',
          opts: [
            'Style Sheet',
            'JavaScript XML',
            'Java Syntax',
            'Database'
          ],
          ans: 1
        }
      ],

      20: [
        {
          id: 1,
          q: 'Capital of France?',
          opts: [
            'Berlin',
            'Madrid',
            'Paris',
            'Rome'
          ],
          ans: 2
        }
      ]
    }
  );

  // ====================================================
  // CURRENT QUESTIONS
  // ====================================================

  const currentQuestions =
    questionsBank[user.duration] ||
    questionsBank[10] ||
    [];

  // ====================================================
  // UPDATE QUESTIONS
  // ====================================================

  const handleUpdateQuestions = (
    timeSlot,
    newQuestionsList
  ) => {
    setQuestionsBank((prev) => ({
      ...prev,
      [timeSlot]: newQuestionsList
    }));
  };

  // ====================================================
  // GENERATE ACCESS CODE
  // ====================================================

  const generate8LetterCode = () => {

    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$*&';

    return Array.from(
      { length: 8 },
      () =>
        chars.charAt(
          Math.floor(
            Math.random() * chars.length
          )
        )
    ).join('');
  };

  // ====================================================
  // CANDIDATE VERIFICATION
  // ====================================================

  const handleVerifyCode = () => {

    const code = accessCode.trim();

    if (code === '') {
      alert('⚠️ Please enter your access code.');
      return;
    }

    if (!validCodes.includes(code)) {
      alert('❌ Invalid Access Code.');
      return;
    }

    if (usedCodes.includes(code)) {
      alert('⚠️ This Access Code has already been used.');
      return;
    }

    setStep('form');
  };

  // ====================================================
  // CANDIDATE DETAILS VALIDATION
  // ====================================================

  const handleStartAssessment = (e) => {

    e.preventDefault();

    const name = user.name.trim();
    const email = user.email.trim();
    const phone = user.phone.trim();

    // -------------------------------
    // NAME
    // -------------------------------

    if (!name) {
      alert('⚠️ Full Name is required.');
      return;
    }

    if (name.length < 2) {
      alert('⚠️ Please enter a valid full name.');
      return;
    }

    // -------------------------------
    // EMAIL
    // -------------------------------

    if (!email) {
      alert('⚠️ Email Address is required.');
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      alert('⚠️ Please enter a valid email address.');
      return;
    }

    // -------------------------------
    // PHONE
    // -------------------------------

    if (!phone) {
      alert('⚠️ Phone Number is required.');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      alert(
        '⚠️ Phone Number must contain exactly 10 digits.'
      );
      return;
    }

    // -------------------------------
    // QUESTIONS CHECK
    // -------------------------------

    if (
      !currentQuestions ||
      currentQuestions.length === 0
    ) {
      alert(
        '⚠️ No questions are available for this test.'
      );
      return;
    }

    // -------------------------------
    // UPDATE CLEAN USER DATA
    // -------------------------------

    setUser((prev) => ({
      ...prev,
      name,
      email,
      phone
    }));

    // -------------------------------
    // START TEST
    // -------------------------------

    setUserAnswers({});

    setScore(0);

    setTimeLeft(user.duration * 60);

    setStep('test');
  };

  // ====================================================
  // FINISH TEST
  // ====================================================

  const finishTest = () => {

    // Prevent duplicate submission
    if (step !== 'test') {
      return;
    }

    let finalScore = 0;

    // -------------------------------
    // SAVE DETAILED ANSWERS
    // -------------------------------

    const detailedAnswers =
      currentQuestions.map((q, index) => {

        const isCorrect =
          userAnswers[index] === q.ans;

        if (isCorrect) {
          finalScore++;
        }

        return {
          question: q.q,

          userAns:
            userAnswers[index] !== undefined
              ? q.opts[userAnswers[index]]
              : 'Skipped',

          correctAns:
            q.opts[q.ans],

          isCorrect
        };
      });

    // -------------------------------
    // SCORE
    // -------------------------------

    setScore(finalScore);

    // -------------------------------
    // SUBMISSION
    // -------------------------------

    const submission = {
      ...user,

      name: user.name.trim(),

      email: user.email.trim(),

      phone: user.phone.trim(),

      score: finalScore,

      total: currentQuestions.length,

      code: accessCode,

      time: new Date().toLocaleTimeString(),

      details: detailedAnswers
    };

    // -------------------------------
    // SAVE SUBMISSION
    // -------------------------------

    setAllSubmissions((prev) => [
      submission,
      ...prev
    ]);

    // -------------------------------
    // MARK CODE AS USED
    // -------------------------------

    setUsedCodes((prev) => [
      ...prev,
      accessCode
    ]);

    // -------------------------------
    // RESULT PAGE
    // -------------------------------

    setStep('result');
  };

  // ====================================================
  // TIMER
  // ====================================================

  useEffect(() => {

    if (
      step !== 'test' ||
      timeLeft <= 0
    ) {
      return;
    }

    const timer = setInterval(() => {

      setTimeLeft((prev) => {

        // Warning
        if (
          prev ===
          adminSettings.warningMinutes * 60
        ) {
          alert(
            `⏳ WARNING: Only ${adminSettings.warningMinutes} minutes left! Your test will be auto-submitted.`
          );
        }

        return prev - 1;
      });

    }, 1000);

    return () => {
      clearInterval(timer);
    };

  }, [
    step,
    timeLeft,
    adminSettings.warningMinutes
  ]);

  // ====================================================
  // AUTO SUBMIT WHEN TIMER REACHES ZERO
  // ====================================================

  useEffect(() => {

    if (
      step === 'test' &&
      timeLeft === 0
    ) {
      finishTest();
    }

  }, [timeLeft, step]);

  // ====================================================
  // DOWNLOAD RESULT PDF
  // ====================================================

  const downloadPDF = () => {

    const doc = new jsPDF();

    doc.text(
      'EXAM RESULT',
      20,
      20
    );

    doc.text(
      `Name: ${user.name}`,
      20,
      30
    );

    doc.text(
      `Email: ${user.email}`,
      20,
      40
    );

    doc.text(
      `Phone: ${user.phone}`,
      20,
      50
    );

    doc.text(
      `Score: ${score} / ${currentQuestions.length}`,
      20,
      60
    );

    doc.save(
      `${user.name || 'Candidate'}_Result.pdf`
    );
  };

  // ====================================================
  // JSX
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

            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-float"></div>

            <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-float-delayed"></div>


            {/* ==================================================
                ACCESS CODE
            ================================================== */}

            {step === 'gate' && (

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
                    onChange={(e) =>
                      setAccessCode(
                        e.target.value
                      )
                    }
                    className="w-full p-5 bg-[#F5F5F7] rounded-2xl text-center text-xl font-mono mb-6 outline-none focus:ring-2 ring-blue-500 transition-all uppercase"
                  />


                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    className="w-full py-5 bg-[#1d1d1f] text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all"
                  >
                    Proceed to Form
                  </button>

                </div>

              </div>
            )}


            {/* ==================================================
                CANDIDATE DETAILS
            ================================================== */}

           ```jsx
{step === 'form' && (
  <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
    <div className="max-w-xl w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white animate-float">

      <h2 className="text-3xl font-black mb-2 text-[#1d1d1f]">
        Candidate Details
      </h2>

      <p className="text-gray-500 mb-8 font-medium">
        Please enter your complete information to start the assessment.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          const name = user.name.trim();
          const email = user.email.trim();
          const phone = user.phone.trim();

          // Full Name
          if (!name) {
            alert("⚠️ Full Name is required!");
            return;
          }

          if (name.length < 2) {
            alert("⚠️ Please enter a valid Full Name!");
            return;
          }

          // Email
          if (!email) {
            alert("⚠️ Email Address is required!");
            return;
          }

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("⚠️ Please enter a valid Email Address!");
            return;
          }

          // Phone
          if (!phone) {
            alert("⚠️ Phone Number is required!");
            return;
          }

          if (!/^\d{10}$/.test(phone)) {
            alert("⚠️ Phone Number must be exactly 10 digits!");
            return;
          }

          // Duration validation
          if (!user.duration) {
            alert("⚠️ Please select Test Duration!");
            return;
          }

          // Check questions
          if (!currentQuestions || currentQuestions.length === 0) {
            alert("⚠️ No questions available for this test duration!");
            return;
          }

          // Reset previous test data
          setUserAnswers({});
          setScore(0);

          // Start test
          setTimeLeft(user.duration * 60);
          setStep("test");
        }}
        className="space-y-4"
      >

        {/* FULL NAME */}
        <input
          type="text"
          placeholder="Full Name *"
          value={user.name}
          required
          minLength={2}
          onChange={(e) =>
            setUser({
              ...user,
              name: e.target.value
            })
          }
          className="w-full p-4 bg-[#F5F5F7] rounded-2xl outline-none focus:ring-2 ring-blue-500"
        />

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email Address *"
          value={user.email}
          required
          onChange={(e) =>
            setUser({
              ...user,
              email: e.target.value
            })
          }
          className="w-full p-4 bg-[#F5F5F7] rounded-2xl outline-none focus:ring-2 ring-blue-500"
        />

        <div className="flex gap-4">

          {/* TEST DURATION */}
          <select
            value={user.duration}
            required
            onChange={(e) =>
              setUser({
                ...user,
                duration: parseInt(e.target.value)
              })
            }
            className="w-1/2 p-4 bg-[#F5F5F7] rounded-2xl outline-none cursor-pointer focus:ring-2 ring-blue-500"
          >
            <option value="">Select Duration</option>
            <option value="10">10 Mins Test</option>
            <option value="15">15 Mins Test</option>
            <option value="20">20 Mins Test</option>
            <option value="25">25 Mins Test</option>
            <option value="30">30 Mins Test</option>
          </select>

          {/* PHONE */}
          <input
            type="tel"
            placeholder="Phone Number *"
            value={user.phone}
            required
            maxLength={10}
            inputMode="numeric"
            onChange={(e) =>
              setUser({
                ...user,
                phone: e.target.value.replace(/\D/g, "")
              })
            }
            className="w-1/2 p-4 bg-[#F5F5F7] rounded-2xl outline-none focus:ring-2 ring-blue-500"
          />

        </div>

        {/* ONLY ONE START BUTTON */}
        <button
          type="submit"
          className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold mt-4 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex justify-center items-center gap-2"
        >
          Start Assessment
          <ChevronRight size={20} />
        </button>

      </form>

    </div>
  </div>
)}
```


            {/* ==================================================
                TEST
            ================================================== */}

            {step === 'test' && (

              <div className="min-h-screen py-10 px-6 relative z-10">

                <div className="max-w-3xl mx-auto">


                  {/* HEADER */}

                  <div className="flex justify-between items-center mb-10 bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm sticky top-5 z-20 border border-white">

                    <span className="font-black tracking-widest text-blue-600">
                      LIVE EXAM
                    </span>

                    <div
                      className={`font-mono px-5 py-2 rounded-xl font-bold transition-all ${
                        timeLeft <=
                        adminSettings.warningMinutes * 60
                          ? 'bg-red-100 text-red-600 animate-pulse'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >

                      {Math.floor(
                        timeLeft / 60
                      )}

                      :

                      {(timeLeft % 60)
                        .toString()
                        .padStart(2, '0')}

                      {' '}Left

                    </div>

                  </div>


                  {/* QUESTIONS */}

                  {currentQuestions.map(
                    (q, idx) => (

                      <div
                        key={q.id || idx}
                        className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-8 border border-white"
                      >

                        <h3 className="text-xl font-bold mb-6 text-[#1d1d1f] leading-relaxed">

                          <span className="text-gray-400 mr-2">
                            {idx + 1}.
                          </span>

                          {q.q}

                        </h3>


                        <div className="grid md:grid-cols-2 gap-4">

                          {q.opts.map(
                            (opt, oIdx) => (

                              <button
                                key={oIdx}
                                type="button"
                                onClick={() =>
                                  setUserAnswers({
                                    ...userAnswers,
                                    [idx]: oIdx
                                  })
                                }
                                className={`w-full p-5 text-left rounded-2xl border-2 transition-all font-medium ${
                                  userAnswers[idx] === oIdx
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-transparent bg-[#F5F5F7] text-gray-600 hover:bg-gray-100'
                                }`}
                              >

                                {opt}

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
                    onClick={finishTest}
                    className="w-full py-5 bg-[#1d1d1f] text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all"
                  >
                    Submit My Responses
                  </button>

                </div>

              </div>
            )}


            {/* ==================================================
                RESULT
            ================================================== */}

            {step === 'result' && (

              <div className="min-h-screen flex items-center justify-center p-6 relative z-10">

                <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[3rem] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white animate-float">

                  <CheckCircle
                    size={60}
                    className="text-green-500 mx-auto mb-6"
                  />

                  <h2 className="text-3xl font-black mb-8 text-[#1d1d1f]">
                    All Done!
                  </h2>


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


                  <button
                    type="button"
                    onClick={downloadPDF}
                    className="w-full py-5 bg-[#1d1d1f] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl"
                  >

                    <Download size={20} />

                    Download Report

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

            onAddCode={() =>
              setValidCodes((prev) => [
                ...prev,
                generate8LetterCode()
              ])
            }

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
```
