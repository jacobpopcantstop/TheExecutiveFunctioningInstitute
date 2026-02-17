/**
 * Module Quiz System - Self-Check for Learning
 * Free self-grading quizzes to test comprehension of module content
 * Not part of formal certification (grading coming soon)
 */

(function() {
  'use strict';

  var currentQuiz = null;
  var userAnswers = {};
  var quizData = null;

  // Load quiz data
  function loadQuizData() {
    fetch('/data/module-quizzes.json')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to load quiz data');
        return response.json();
      })
      .then(function(data) {
        quizData = data;
        var moduleId = getModuleIdFromPage();
        if (moduleId && quizData.quizzes[moduleId]) {
          initializeQuiz(moduleId);
        }
      })
      .catch(function(error) {
        console.warn('[Module Quiz] Could not load quiz data:', error);
      });
  }

  // Extract module ID from page URL or data attribute
  function getModuleIdFromPage() {
    var pathname = window.location.pathname;
    var match = pathname.match(/(module-\d+|module-[a-z-]+)/);
    if (match) return match[1];

    // Check for data attribute on quiz container
    var container = document.getElementById('module-quiz');
    if (container && container.getAttribute('data-module-id')) {
      return container.getAttribute('data-module-id');
    }

    return null;
  }

  // Initialize quiz for current module
  function initializeQuiz(moduleId) {
    if (!quizData || !quizData.quizzes[moduleId]) return;

    currentQuiz = {
      id: moduleId,
      data: quizData.quizzes[moduleId],
      currentQuestion: 0
    };

    renderQuizInterface();
    renderQuestion(0);
  }

  // Render the quiz container
  function renderQuizInterface() {
    var container = document.getElementById('module-quiz');
    if (!container) return;

    var header = document.createElement('div');
    header.className = 'module-quiz__header';
    header.innerHTML = '<h3 style="margin-bottom:var(--space-sm);">Self-Check Quiz</h3>' +
      '<p style="margin:0;color:var(--color-text-light);font-size:0.9rem;">' +
      'Test your understanding of the module content. This self-check quiz is free, ' +
      'ungraded, and helps you prepare for formal certification assessment (coming soon).' +
      '</p>';
    container.appendChild(header);

    var questionsWrapper = document.createElement('div');
    questionsWrapper.className = 'module-quiz__questions';
    questionsWrapper.id = 'quiz-questions';
    container.appendChild(questionsWrapper);

    var controls = document.createElement('div');
    controls.className = 'module-quiz__controls';
    controls.style.marginTop = 'var(--space-xl)';
    controls.style.display = 'flex';
    controls.style.gap = 'var(--space-md)';
    controls.style.justifyContent = 'space-between';
    controls.style.flexWrap = 'wrap';

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.id = 'quiz-prev-btn';
    prevBtn.className = 'btn btn--secondary btn--sm';
    prevBtn.textContent = '← Previous';
    prevBtn.addEventListener('click', function() { previousQuestion(); });
    controls.appendChild(prevBtn);

    var progress = document.createElement('span');
    progress.id = 'quiz-progress';
    progress.style.alignSelf = 'center';
    progress.style.color = 'var(--color-text-muted)';
    progress.style.fontSize = '0.9rem';
    controls.appendChild(progress);

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.id = 'quiz-next-btn';
    nextBtn.className = 'btn btn--primary btn--sm';
    nextBtn.textContent = 'Next →';
    nextBtn.addEventListener('click', function() { nextQuestion(); });
    controls.appendChild(nextBtn);

    container.appendChild(controls);

    // Results section (hidden initially)
    var resultsSection = document.createElement('div');
    resultsSection.id = 'quiz-results';
    resultsSection.style.display = 'none';
    resultsSection.className = 'module-quiz__results';
    resultsSection.style.marginTop = 'var(--space-xl)';
    resultsSection.style.padding = 'var(--space-lg)';
    resultsSection.style.background = 'var(--color-bg-alt)';
    resultsSection.style.borderRadius = 'var(--border-radius)';
    container.appendChild(resultsSection);
  }

  // Render current question
  function renderQuestion(index) {
    if (!currentQuiz || !currentQuiz.data.questions[index]) return;

    var question = currentQuiz.data.questions[index];
    var container = document.getElementById('quiz-questions');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    var questionDiv = document.createElement('div');
    questionDiv.className = 'module-quiz__question';
    questionDiv.style.marginBottom = 'var(--space-xl)';

    // Question text
    var questionText = document.createElement('p');
    questionText.style.fontSize = '1.05rem';
    questionText.style.fontWeight = '600';
    questionText.style.marginBottom = 'var(--space-lg)';
    questionText.textContent = (index + 1) + '. ' + question.question;
    questionDiv.appendChild(questionText);

    // Answer options
    var optionsDiv = document.createElement('div');
    optionsDiv.className = 'module-quiz__options';
    optionsDiv.style.display = 'flex';
    optionsDiv.style.flexDirection = 'column';
    optionsDiv.style.gap = 'var(--space-sm)';

    question.options.forEach(function(option, optionIndex) {
      var label = document.createElement('label');
      label.style.display = 'flex';
      label.style.gap = 'var(--space-sm)';
      label.style.padding = 'var(--space-sm) var(--space-md)';
      label.style.background = userAnswers[question.id] === optionIndex ? 'var(--color-accent-light)' : 'transparent';
      label.style.borderRadius = 'var(--border-radius)';
      label.style.cursor = 'pointer';
      label.style.transition = 'background 0.2s ease';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'question-' + question.id;
      input.value = optionIndex;
      input.checked = userAnswers[question.id] === optionIndex;
      input.addEventListener('change', function() {
        recordAnswer(question.id, optionIndex);
        // Highlight selected option
        Array.from(optionsDiv.querySelectorAll('label')).forEach(function(lbl, idx) {
          lbl.style.background = idx === optionIndex ? 'var(--color-accent-light)' : 'transparent';
        });
      });
      label.appendChild(input);

      var span = document.createElement('span');
      span.textContent = option;
      label.appendChild(span);

      optionsDiv.appendChild(label);
    });

    questionDiv.appendChild(optionsDiv);

    // Explanation (if answer selected)
    if (userAnswers[question.id] !== undefined) {
      var explanationDiv = document.createElement('div');
      explanationDiv.className = 'module-quiz__explanation';
      explanationDiv.style.marginTop = 'var(--space-lg)';
      explanationDiv.style.padding = 'var(--space-md)';
      explanationDiv.style.background = userAnswers[question.id] === question.correct ?
        'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)';
      explanationDiv.style.borderLeft = '4px solid ' +
        (userAnswers[question.id] === question.correct ? '#4CAF50' : '#2196F3');
      explanationDiv.style.borderRadius = 'var(--border-radius)';

      var isCorrect = userAnswers[question.id] === question.correct;
      var label = document.createElement('strong');
      label.style.display = 'block';
      label.style.marginBottom = 'var(--space-xs)';
      label.textContent = isCorrect ? '✓ Correct!' : 'Learn More:';
      label.style.color = isCorrect ? '#4CAF50' : '#2196F3';
      explanationDiv.appendChild(label);

      var text = document.createElement('p');
      text.style.margin = '0';
      text.style.fontSize = '0.95rem';
      text.style.lineHeight = '1.5';
      text.textContent = question.explanation;
      explanationDiv.appendChild(text);

      questionDiv.appendChild(explanationDiv);
    }

    container.appendChild(questionDiv);
    updateControls();
    updateProgress();
  }

  // Record user answer
  function recordAnswer(questionId, optionIndex) {
    userAnswers[questionId] = optionIndex;
  }

  // Navigate to next question
  function nextQuestion() {
    if (!currentQuiz) return;
    if (currentQuiz.currentQuestion < currentQuiz.data.questions.length - 1) {
      currentQuiz.currentQuestion++;
      renderQuestion(currentQuiz.currentQuestion);
    } else {
      showResults();
    }
  }

  // Navigate to previous question
  function previousQuestion() {
    if (!currentQuiz) return;
    if (currentQuiz.currentQuestion > 0) {
      currentQuiz.currentQuestion--;
      renderQuestion(currentQuiz.currentQuestion);
    }
  }

  // Update button states
  function updateControls() {
    if (!currentQuiz) return;
    var prevBtn = document.getElementById('quiz-prev-btn');
    var nextBtn = document.getElementById('quiz-next-btn');

    if (prevBtn) prevBtn.disabled = currentQuiz.currentQuestion === 0;
    if (nextBtn) {
      if (currentQuiz.currentQuestion === currentQuiz.data.questions.length - 1) {
        nextBtn.textContent = 'Show Results';
      } else {
        nextBtn.textContent = 'Next →';
      }
    }
  }

  // Update progress indicator
  function updateProgress() {
    if (!currentQuiz) return;
    var progress = document.getElementById('quiz-progress');
    if (progress) {
      progress.textContent = (currentQuiz.currentQuestion + 1) + ' of ' +
        currentQuiz.data.questions.length;
    }
  }

  // Calculate and show results
  function showResults() {
    if (!currentQuiz) return;

    var correct = 0;
    currentQuiz.data.questions.forEach(function(question) {
      if (userAnswers[question.id] === question.correct) {
        correct++;
      }
    });

    var total = currentQuiz.data.questions.length;
    var percentage = Math.round((correct / total) * 100);

    var resultsDiv = document.getElementById('quiz-results');
    if (!resultsDiv) return;

    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '';

    var title = document.createElement('h4');
    title.style.marginBottom = 'var(--space-md)';
    title.textContent = 'Quiz Results';
    resultsDiv.appendChild(title);

    var scoreDiv = document.createElement('div');
    scoreDiv.style.fontSize = '1.1rem';
    scoreDiv.style.marginBottom = 'var(--space-md)';
    scoreDiv.style.lineHeight = '1.8';
    scoreDiv.innerHTML = '<strong>Score:</strong> ' + correct + ' of ' + total + ' (' + percentage + '%)<br>' +
      '<strong>Feedback:</strong> ' + getResultsMessage(percentage);
    resultsDiv.appendChild(scoreDiv);

    var note = document.createElement('p');
    note.style.fontSize = '0.9rem';
    note.style.color = 'var(--color-text-light)';
    note.style.marginBottom = 'var(--space-md)';
    note.textContent = 'This self-check quiz is for learning purposes. Formal graded assessments are coming soon as part of paid certification services.';
    resultsDiv.appendChild(note);

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn--secondary btn--sm';
    resetBtn.textContent = 'Retake Quiz';
    resetBtn.addEventListener('click', function() { resetQuiz(); });
    resultsDiv.appendChild(resetBtn);

    // Hide question navigation
    var controls = document.querySelector('.module-quiz__controls');
    if (controls) controls.style.display = 'none';

    // Show results section
    document.getElementById('quiz-questions').style.display = 'none';
  }

  // Get motivational message based on score
  function getResultsMessage(percentage) {
    if (percentage === 100) return 'Perfect! You've mastered this module.';
    if (percentage >= 80) return 'Great work! You understand the key concepts.';
    if (percentage >= 60) return 'Good effort! Review the explanations above to solidify your understanding.';
    return 'Keep studying! Read through the module again and retake the quiz.';
  }

  // Reset quiz
  function resetQuiz() {
    userAnswers = {};
    currentQuiz.currentQuestion = 0;
    document.getElementById('quiz-results').style.display = 'none';
    document.getElementById('quiz-questions').style.display = 'block';
    document.querySelector('.module-quiz__controls').style.display = 'flex';
    renderQuestion(0);
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('module-quiz');
    if (container) {
      loadQuizData();
    }
  });

  // Expose for testing
  window.ModuleQuiz = {
    getScore: function() {
      if (!currentQuiz) return null;
      var correct = 0;
      currentQuiz.data.questions.forEach(function(question) {
        if (userAnswers[question.id] === question.correct) {
          correct++;
        }
      });
      return { correct: correct, total: currentQuiz.data.questions.length };
    }
  };
})();
