'use client';

import { useEffect, useState } from 'react';
import { CircleHelp, Trophy, RefreshCw, Play, Headphones } from 'lucide-react';
import { useMusic } from '../../components/AppShell';

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function QuizPage() {
  const music = useMusic();
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function prepare() {
    setLoading(true);
    setError('');
    setChosen('');
    setQuestions([]);
    try {
      let pool = music.tracks.filter((track) => track.title && track.artist && track.previewUrl);
      if (pool.length < 4) {
        const response = await fetch('/api/music?q=popular%20music&limit=50');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Music search failed.');
        pool = data.tracks || [];
        if (pool.length) {
          music.setTracks((previous) => {
            const unique = new Map(previous.map((track) => [String(track.id), track]));
            pool.forEach((track) => unique.set(String(track.id), track));
            return Array.from(unique.values());
          });
        }
      }
      const uniquePool = Array.from(new Map(pool.filter((track) => track.previewUrl).map((track) => [String(track.id), track])).values());
      if (uniquePool.length < 4) {
        setError('The music provider returned fewer than four playable previews. Try again later or search another genre in Explore.');
        return;
      }
      const built = [];
      const working = shuffle(uniquePool);
      const count = Math.min(5, working.length);
      for (let i = 0; i < count; i += 1) {
        const answer = working[i];
        const distractors = shuffle(uniquePool.filter((track) => String(track.id) !== String(answer.id))).slice(0, 3);
        const options = shuffle([answer, ...distractors]);
        if (options.length === 4) built.push({ answer, options });
      }
      if (!built.length) {
        setError('Could not create questions from the available tracks. Please try again.');
        return;
      }
      setQuestions(built);
      setRound(0);
      setScore(0);
    } catch (err) {
      setError(err.message || 'Could not prepare the quiz. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    prepare();
  }, []);

  const question = questions[round];

  function choose(track) {
    if (chosen || !question) return;
    setChosen(String(track.id));
    if (String(track.id) === String(question.answer.id)) setScore((value) => value + 1);
  }

  function nextQuestion() {
    music.setPlaying(false);
    if (round + 1 < questions.length) {
      setRound((value) => value + 1);
      setChosen('');
    } else {
      setRound(questions.length);
      setChosen('');
    }
  }

  return (
    <section className="page-wrap feature-page quiz-page">
      <div className="eyebrow"><CircleHelp size={14} /> TEST YOUR MUSIC KNOWLEDGE</div>
      <h1 className="page-title">Name that <span className="gradient-text">track.</span></h1>
      <p className="page-subtitle">Listen to a preview and choose the matching song title. The quiz needs at least four playable previews.</p>
      {loading ? <div className="empty-state"><Headphones size={28} /><b>Preparing your quiz…</b><p>Finding tracks with playable previews.</p></div> : error ? <div className="empty-state"><CircleHelp size={28} /><b>The quiz could not start</b><p>{error}</p><button className="button-primary" onClick={prepare}><RefreshCw size={15} /> Try again</button></div> : question && round < questions.length ? (
        <div className="quiz-card">
          <div className="quiz-topline"><span>QUESTION {round + 1} OF {questions.length}</span><span><Trophy size={15} /> SCORE {score}</span></div>
          <div className="quiz-art"><img src={question.answer.artwork || '/cover.svg'} alt="Mystery track artwork" /><div className="quiz-art-overlay"><span className="quiz-sound-bars"><i /><i /><i /><i /><i /></span><span>Listen carefully</span></div></div>
          <button className="button-primary quiz-play" onClick={() => music.playTrack(question.answer, questions.map((item) => item.answer))}><Play size={16} fill="currentColor" /> Play song preview</button>
          <h2>Which song is playing?</h2>
          <div className="quiz-options">{question.options.map((track) => {
            const isAnswer = String(track.id) === String(question.answer.id);
            const isChosen = chosen === String(track.id);
            return <button key={track.id} className={`quiz-option ${chosen && isAnswer ? 'quiz-correct' : ''} ${isChosen && !isAnswer ? 'quiz-wrong' : ''}`} onClick={() => choose(track)} disabled={Boolean(chosen)}><span>{track.title}</span><small>{track.artist}</small></button>;
          })}</div>
          {chosen && <div className="quiz-feedback"><b>{chosen === String(question.answer.id) ? 'Correct! Nice ear.' : 'Not quite — here is the answer.'}</b><p>{question.answer.title} · {question.answer.artist}</p><button className="button-primary" onClick={nextQuestion}>{round + 1 === questions.length ? 'See results' : 'Next question'} →</button></div>}
        </div>
      ) : questions.length > 0 ? (
        <div className="empty-state quiz-finished"><Trophy size={34} /><h2>Quiz complete!</h2><p>You scored <b>{score} out of {questions.length}</b>. {score === questions.length ? 'Perfect score — you know your music!' : 'Keep listening and try again to improve your score.'}</p><button className="button-primary" onClick={prepare}><RefreshCw size={16} /> Play again</button></div>
      ) : <div className="empty-state"><b>No quiz questions yet</b><button className="button-primary" onClick={prepare}>Start quiz</button></div>}
    </section>
  );
}
