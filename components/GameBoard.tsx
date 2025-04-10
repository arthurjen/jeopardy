"use client";

import type React from "react";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  XIcon,
  Save,
  Edit2,
  Check,
  User,
  Clock,
  Play,
  AlertCircle,
  DollarSign,
  Upload,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Core types
interface Question {
  id: string;
  answer: string;
  question: string;
  value: number;
  isDailyDouble: boolean;
  isAnswered: boolean;
}

interface Category {
  id: string;
  title: string;
  questions: Question[];
}

interface Player {
  id: number;
  name: string;
  score: number;
}

// Animation variants
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const modalVariants = {
  initial: { scale: 0.8, y: 20, opacity: 0 },
  animate: { scale: 1, y: 0, opacity: 1 },
  exit: { scale: 0.8, y: 20, opacity: 0 },
  transition: { type: "spring", damping: 20, stiffness: 300 },
};

// Default game data
const createDefaultCategories = () =>
  Array(6)
    .fill(null)
    .map((_, catIndex) => ({
      id: `cat-${catIndex}`,
      title: `Category ${catIndex + 1}`,
      questions: [200, 400, 600, 800, 1000].map((value, qIndex) => ({
        id: `${catIndex}-${qIndex}`,
        answer: `Placeholder answer for $${value}`,
        question: `What is the placeholder question for $${value}?`,
        value,
        isDailyDouble: false,
        isAnswered: false,
      })),
    }));

const Label = ({
  htmlFor,
  className,
  children,
}: {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <label
    htmlFor={htmlFor}
    className={cn("text-sm font-medium leading-none", className)}
  >
    {children}
  </label>
);

const GameBoard = () => {
  // Game state
  const [categories, setCategories] = useState<Category[]>([]);

  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    const savedCategories = localStorage.getItem("jeopardyCategories");
    setCategories(
      savedCategories ? JSON.parse(savedCategories) : createDefaultCategories()
    );

    const savedPlayers = localStorage.getItem("jeopardyPlayers");
    setPlayers(
      savedPlayers
        ? JSON.parse(savedPlayers)
        : [
            { id: 1, name: "Player 1", score: 0 },
            { id: 2, name: "Player 2", score: 0 },
            { id: 3, name: "Player 3", score: 0 },
            { id: 4, name: "Player 4", score: 0 },
          ]
    );
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("jeopardyCategories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("jeopardyPlayers", JSON.stringify(players));
  }, [players]);

  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [answeringPlayer, setAnsweringPlayer] = useState<number | null>(null);
  const [attemptedPlayers, setAttemptedPlayers] = useState<number[]>([]);
  const [editingPlayerName, setEditingPlayerName] = useState<number | null>(
    null
  );

  // Daily Double state
  const [wagerAmount, setWagerAmount] = useState<number>(0);
  const [wagerSubmitted, setWagerSubmitted] = useState<boolean>(false);

  // Edit mode state
  const [editingCategory, setEditingCategory] = useState<{
    index: number;
    title: string;
  } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{
    categoryIndex: number;
    questionIndex: number;
    question: string;
    answer: string;
  } | null>(null);

  // Auto-close question when all players have attempted
  useEffect(() => {
    if (
      attemptedPlayers.length === players.length &&
      selectedQuestion &&
      !selectedQuestion.isDailyDouble
    ) {
      handleTimesUp();
    }
  }, [attemptedPlayers, players.length]);

  // Player name editing
  const handlePlayerNameEdit = (playerId: number) => {
    if (editMode) return;
    setEditingPlayerName(playerId);
  };

  const savePlayerName = (playerId: number, newName: string) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId ? { ...player, name: newName } : player
      )
    );
    setEditingPlayerName(null);
  };

  // Game initialization
  const initializeGame = () => {
    const updatedCategories = [...categories].map((category) => ({
      ...category,
      questions: category.questions.map((question) => ({
        ...question,
        isDailyDouble: false,
        isAnswered: false,
      })),
    }));

    // Assign Daily Double
    const catIndex = Math.floor(Math.random() * 6);
    const qIndex = Math.floor(Math.random() * 5);
    updatedCategories[catIndex].questions[qIndex].isDailyDouble = true;

    setCategories(updatedCategories);
    setGameStarted(true);
    setEditMode(false);
    // Only reset scores, keep names
    setPlayers(players.map((player) => ({ ...player, score: 0 })));
  };

  const editGame = () => {
    if (categories.length === 0) {
      setCategories(createDefaultCategories());
    }
    setGameStarted(true);
    setEditMode(true);
  };

  // Question selection
  const handleQuestionSelect = (
    categoryId: string,
    question: Question,
    categoryIndex: number,
    questionIndex: number
  ) => {
    if (editMode) {
      setEditingQuestion({
        categoryIndex,
        questionIndex,
        question: question.question,
        answer: question.answer,
      });
      return;
    }

    if (question.isAnswered) return;

    setSelectedQuestion(question);
    setShowAnswer(false);
    setAnsweringPlayer(null);
    setAttemptedPlayers([]);
    setWagerAmount(question.value);
    setWagerSubmitted(false);
  };

  // Category editing
  const handleCategoryEdit = (categoryIndex: number) => {
    if (!editMode) return;
    setEditingCategory({
      index: categoryIndex,
      title: categories[categoryIndex].title,
    });
  };

  const saveCategory = () => {
    if (!editingCategory) return;
    setCategories((prev) => {
      const updated = [...prev];
      updated[editingCategory.index].title = editingCategory.title;
      return updated;
    });
    setEditingCategory(null);
  };

  // Question editing
  const saveQuestion = () => {
    if (!editingQuestion) return;

    const { categoryIndex, questionIndex, question, answer } = editingQuestion;
    setCategories((prev) => {
      const updated = [...prev];
      updated[categoryIndex].questions[questionIndex] = {
        ...updated[categoryIndex].questions[questionIndex],
        question,
        answer,
      };
      return updated;
    });
    setEditingQuestion(null);
  };

  // Daily Double wager
  const getMaxWager = (playerId: number): number => {
    return Math.max(players[playerId - 1].score, 1000);
  };

  const handleWagerSubmit = () => {
    if (!answeringPlayer || !selectedQuestion?.isDailyDouble) return;

    const maxWager = getMaxWager(answeringPlayer);
    const validWager = Math.min(Math.max(5, wagerAmount), maxWager);
    setWagerAmount(validWager);
    setWagerSubmitted(true);
  };

  // Answer handling
  const handleAnswer = (correct: boolean) => {
    if (!selectedQuestion || answeringPlayer === null) return;

    // Calculate score change
    const scoreChange = selectedQuestion.isDailyDouble
      ? correct
        ? wagerAmount
        : -wagerAmount
      : correct
      ? selectedQuestion.value
      : -selectedQuestion.value;

    // Update player score
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === answeringPlayer
          ? { ...player, score: player.score + scoreChange }
          : player
      )
    );

    // For regular questions with incorrect answers
    if (!selectedQuestion.isDailyDouble && !correct) {
      setAttemptedPlayers((prev) => [...prev, answeringPlayer]);
      setAnsweringPlayer(null);
      return;
    }

    // Set current player and mark question as answered
    setCurrentPlayer(answeringPlayer);
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        questions: category.questions.map((q) =>
          q.id === selectedQuestion.id ? { ...q, isAnswered: true } : q
        ),
      }))
    );

    // Reset state
    setSelectedQuestion(null);
    setAttemptedPlayers([]);
    setWagerSubmitted(false);
    setAnsweringPlayer(null);
  };

  // Time's up handling
  const handleTimesUp = () => {
    if (!selectedQuestion) return;

    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        questions: category.questions.map((q) =>
          q.id === selectedQuestion.id ? { ...q, isAnswered: true } : q
        ),
      }))
    );

    setSelectedQuestion(null);
    setAnsweringPlayer(null);
    setAttemptedPlayers([]);
    setWagerSubmitted(false);
  };

  // Utility functions
  const hasPlayerAttempted = (playerId: number) =>
    attemptedPlayers.includes(playerId);

  const isGameOver = useMemo(
    () =>
      categories.every((category) =>
        category.questions.every((question) => question.isAnswered)
      ),
    [categories]
  );

  const finishEditing = () => {
    setEditMode(false);
    setGameStarted(false);
  };

  // Render player selection for Daily Double or regular questions
  const renderPlayerSelection = (isDailyDouble = false) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {players.map((player) => {
        const hasAttempted = hasPlayerAttempted(player.id);
        const isDisabled = !isDailyDouble && hasAttempted;
        const isSelected = answeringPlayer === player.id;

        return (
          <Button
            key={player.id}
            type="button"
            variant="ghost"
            className={cn(
              "flex items-center justify-start p-2 h-auto rounded-md",
              isDisabled
                ? "opacity-50 cursor-not-allowed bg-blue-950"
                : "cursor-pointer",
              isSelected
                ? "bg-blue-700 ring-1 ring-yellow-400"
                : isDisabled
                ? ""
                : "bg-blue-900 hover:bg-blue-700"
            )}
            onClick={() => !isDisabled && setAnsweringPlayer(player.id)}
            disabled={isDisabled}
          >
            <span
              className={cn(
                "flex items-center text-white [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]",
                isDisabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
            >
              {!isDailyDouble && hasAttempted ? (
                <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
              ) : (
                <User className="h-4 w-4 mr-2" />
              )}
              {player.name}
            </span>
          </Button>
        );
      })}
    </div>
  );

  // Render Daily Double wager section
  const renderDailyDoubleWager = () => (
    <div className="mb-6 bg-blue-700 p-4 rounded-lg border border-yellow-400">
      <h3 className="text-yellow-300 text-lg font-bold mb-3 [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]">
        Daily Double Wager
      </h3>

      {answeringPlayer ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Label className="text-white">
              {players.find((p) => p.id === answeringPlayer)?.name}'s Wager:
            </Label>
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-400 h-4 w-4" />
              <Input
                type="number"
                value={wagerAmount}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setWagerAmount(value);
                  }
                }}
                className="pl-8 bg-blue-600 border-blue-500 text-white"
                min={5}
                max={getMaxWager(answeringPlayer)}
              />
            </div>
          </div>
          <p className="text-xs text-yellow-200">
            Maximum wager: ${getMaxWager(answeringPlayer)}
          </p>
          <Button
            onClick={handleWagerSubmit}
            className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
          >
            Confirm Wager
          </Button>
        </div>
      ) : (
        <div>
          <p className="text-white mb-3">
            Select a player to answer this Daily Double:
          </p>
          {renderPlayerSelection(true)}
        </div>
      )}
    </div>
  );

  // Add import/export functions before the return statement
  const handleExportQuestions = () => {
    try {
      const exportData = categories.map(category => ({
        ...category,
        questions: category.questions.map(question => ({
          id: question.id,
          answer: question.answer,
          question: question.question,
          value: question.value,
        }))
      }));
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "jeopardy-questions.json";
      link.click();
      URL.revokeObjectURL(url);
      
      alert("Game data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export game data");
    }
  };

  const handleImportQuestions = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedCategories = JSON.parse(e.target?.result as string);
          // Validate the imported data structure
          if (
            Array.isArray(importedCategories) &&
            importedCategories.every(
              (cat) =>
                "id" in cat &&
                "title" in cat &&
                "questions" in cat &&
                Array.isArray(cat.questions) &&
                cat.questions.every(
                  (q) =>
                    "id" in q &&
                    "answer" in q &&
                    "question" in q &&
                    "value" in q
                )
            )
          ) {
            setCategories(importedCategories);
            alert("Game data imported successfully!");

          } else {
            alert("Invalid JSON format for Jeopardy questions");
          }
        } catch (error) {
          console.error("Import error:", error);
          alert("Error parsing JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-blue-900 p-6 overflow-hidden">
      <AnimatePresence mode="wait">
        {!gameStarted ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center min-h-[80vh] text-center"
          >
            <motion.div
              className="max-w-3xl w-full bg-blue-800 rounded-xl shadow-2xl p-8 border-4 border-yellow-400"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.h1
                className="text-white text-6xl font-bold mb-6 tracking-tight [text-shadow:_0_4px_8px_rgba(0,0,0,0.5)]"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                JEOPARDY!
              </motion.h1>
              <motion.p
                className="text-yellow-300 text-xl mb-6 [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]"
                initial={{ y: -15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                Design and host your own Jeopardy game.
              </motion.p>
              <motion.div
                className="w-full h-1 bg-yellow-400 mb-8"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              ></motion.div>

              <motion.div
                className="flex flex-col sm:flex-row justify-center gap-4 mt-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Button
                  className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-lg px-8 py-6 rounded-lg shadow-lg transform transition hover:scale-105 cursor-pointer"
                  onClick={handleExportQuestions}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Export
                </Button>
                <label className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-lg px-8 py-6 rounded-lg shadow-lg transform transition hover:scale-105 flex items-center justify-center cursor-pointer inline-flex h-10">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportQuestions}
                    className="hidden"
                  />
                  <Upload className="mr-2 h-5 w-5" />
                  Import
                </label>
                <Button
                  className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold text-lg px-8 py-6 rounded-lg shadow-lg transform transition hover:scale-105 cursor-pointer"
                  onClick={editGame}
                >
                  <Edit2 className="mr-2 h-5 w-5" />
                  Edit Game
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-yellow-400 font-bold text-lg px-8 py-6 rounded-lg shadow-lg transform transition hover:scale-105 cursor-pointer"
                  onClick={initializeGame}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Game
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="game-board" {...fadeIn}>
            {/* Edit Mode Header */}
            {editMode && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-yellow-400 text-blue-900 p-3 rounded-lg mb-4 flex justify-between items-center"
              >
                <h2 className="text-xl font-bold">Edit Mode</h2>
                <div className="flex gap-2">
                  <Button
                    className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-lg px-8 py-6 rounded-lg shadow-lg transform transition hover:scale-105 cursor-pointer"
                    onClick={handleExportQuestions}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Export
                  </Button>
                  <label className="bg-blue-400 hover:bg-blue-500 text-white font-bold text-lg px-8 py-6 rounded-lg shadow-lg transform transition hover:scale-105 flex items-center justify-center cursor-pointer inline-flex h-10">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportQuestions}
                      className="hidden"
                    />
                    <Upload className="mr-2 h-5 w-5" />
                    Import
                  </label>
                  <Button
                    onClick={finishEditing}
                    className="bg-blue-800 hover:bg-blue-700 text-white font-bold text-lg px-8 py-6 rounded-lg shadow-lg transform transition hover:scale-105 cursor-pointer"
                  >
                    <Check className="mr-2 h-5 w-5" />
                    Done Editing
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Scoreboard */}
            {!editMode && (
              <motion.div
                className="flex justify-between items-center bg-blue-800 p-4 rounded-lg shadow-md mb-6"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {players.map((player, index) => (
                  <motion.div
                    key={player.id}
                    className={`text-center p-2 rounded-lg ${
                      player.id === currentPlayer
                        ? "bg-blue-700 ring-2 ring-yellow-400"
                        : ""
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index, duration: 0.2 }}
                  >
                    {editingPlayerName === player.id ? (
                      <div className="mb-1">
                        <Input
                          className="bg-blue-600 border-blue-500 text-white text-center p-1 w-32"
                          defaultValue={player.name}
                          autoFocus
                          onBlur={(e) =>
                            savePlayerName(player.id, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              savePlayerName(player.id, e.currentTarget.value);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <p
                        className="text-white text-lg font-semibold cursor-pointer hover:text-yellow-300 transition-colors [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]"
                        onClick={() => handlePlayerNameEdit(player.id)}
                        title="Click to edit player name"
                      >
                        {player.name}
                      </p>
                    )}
                    <p
                      className={`text-2xl font-bold ${
                        player.score >= 0 ? "text-green-400" : "text-red-400"
                      } [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]`}
                    >
                      ${player.score}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Game Board */}
            <div className="grid grid-cols-6 gap-2 mb-2">
              {/* Category Headers */}
              {categories.map((category, catIndex) => (
                <motion.div
                  key={category.id}
                  className={`bg-blue-700 text-white text-center py-8 rounded-lg shadow-md text-lg font-bold uppercase
                    ${
                      editMode
                        ? "cursor-pointer hover:bg-blue-600 transition-colors"
                        : ""
                    }`}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05 * catIndex, duration: 0.2 }}
                  onClick={() => editMode && handleCategoryEdit(catIndex)}
                >
                  <span className="[text-shadow:_0_2px_4px_rgba(0,0,0,0.6)]">
                    {category.title}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-6 grid-rows-5 gap-2 grid-flow-col">
              {categories.map((category, catIndex) =>
                category.questions.map((question, qIndex) => (
                  <motion.div
                    key={question.id}
                    whileHover={{
                      scale: editMode || !question.isAnswered ? 1.03 : 1,
                    }}
                    className={`relative bg-blue-600 rounded-lg shadow-md 
                      ${
                        editMode || !question.isAnswered ? "cursor-pointer" : ""
                      }
                      ${!editMode && question.isAnswered ? "opacity-50" : ""}`}
                    onClick={() =>
                      handleQuestionSelect(
                        category.id,
                        question,
                        catIndex,
                        qIndex
                      )
                    }
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0,
                      duration: 0.2,
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <div className="text-yellow-400 text-4xl font-bold py-8 text-center [text-shadow:_0_2px_4px_rgba(0,0,0,0.7)]">
                      {!editMode && question.isAnswered
                        ? ""
                        : `$${question.value}`}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Question Modal */}
            <AnimatePresence>
              {selectedQuestion && !editMode && (
                <motion.div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                  {...fadeIn}
                >
                  <motion.div
                    className="bg-blue-800 rounded-lg p-8 max-w-2xl w-full"
                    {...modalVariants}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-white [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
                        {selectedQuestion.isDailyDouble ? (
                          <span className="flex items-center">
                            <span className="text-yellow-300 mr-2">
                              DAILY DOUBLE!
                            </span>
                            <DollarSign className="h-6 w-6 text-yellow-300" />
                          </span>
                        ) : (
                          `$${selectedQuestion.value}`
                        )}
                      </h2>
                      {!selectedQuestion.isDailyDouble && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                          onClick={handleTimesUp}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Out of Time
                        </Button>
                      )}
                    </div>

                    {/* Daily Double Wager Section */}
                    {selectedQuestion.isDailyDouble &&
                      !wagerSubmitted &&
                      renderDailyDoubleWager()}

                    {/* Question Content */}
                    {(!selectedQuestion.isDailyDouble || wagerSubmitted) && (
                      <>
                        <p className="text-white text-lg mb-6 uppercase [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
                          {showAnswer
                            ? selectedQuestion.question
                            : selectedQuestion.answer}
                        </p>

                        {/* Player Selection for Regular Questions */}
                        {showAnswer && !selectedQuestion.isDailyDouble && (
                          <div className="mb-6">
                            <h3 className="text-white text-md mb-2 [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]">
                              Select player who answered:
                            </h3>
                            {renderPlayerSelection()}
                          </div>
                        )}

                        <div className="flex gap-4">
                          {!showAnswer ? (
                            <Button
                              className="bg-yellow-500 hover:bg-yellow-600"
                              onClick={() => setShowAnswer(true)}
                            >
                              Show Question
                            </Button>
                          ) : (
                            <>
                              <Button
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => handleAnswer(true)}
                                disabled={answeringPlayer === null}
                              >
                                Correct
                              </Button>
                              <Button
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleAnswer(false)}
                                disabled={answeringPlayer === null}
                              >
                                Incorrect
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category Edit Modal */}
            <AnimatePresence>
              {editingCategory && (
                <motion.div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                  {...fadeIn}
                >
                  <motion.div
                    className="bg-blue-800 rounded-lg p-8 max-w-md w-full"
                    {...modalVariants}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-white [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
                        Edit Category
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCategory(null)}
                      >
                        <XIcon className="h-6 w-6 text-white" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <Input
                        value={editingCategory.title}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            title: e.target.value,
                          })
                        }
                        className="bg-blue-700 border-blue-600 text-white"
                      />

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={saveCategory}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question Edit Modal */}
            <AnimatePresence>
              {editingQuestion && (
                <motion.div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                  {...fadeIn}
                >
                  <motion.div
                    className="bg-blue-800 rounded-lg p-8 max-w-2xl w-full"
                    {...modalVariants}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-white [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
                        {categories[editingQuestion.categoryIndex].title} for $
                        {
                          categories[editingQuestion.categoryIndex].questions[
                            editingQuestion.questionIndex
                          ].value
                        }
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingQuestion(null)}
                      >
                        <XIcon className="h-6 w-6 text-white" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-white text-sm mb-1 block [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]">
                          Answer (shown first)
                        </label>
                        <Input
                          value={editingQuestion.answer}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              answer: e.target.value,
                            })
                          }
                          className="bg-blue-700 border-blue-600 text-white h-24"
                        />
                      </div>

                      <div>
                        <label className="text-white text-sm mb-1 block [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]">
                          Question (the correct response)
                        </label>
                        <Input
                          value={editingQuestion.question}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              question: e.target.value,
                            })
                          }
                          className="bg-blue-700 border-blue-600 text-white h-24"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={saveQuestion}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Over Modal */}
            <AnimatePresence>
              {isGameOver && !editMode && (
                <motion.div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                  {...fadeIn}
                >
                  <motion.div
                    className="bg-blue-800 rounded-lg p-8 text-center"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  >
                    <h2 className="text-3xl font-bold text-white mb-4 [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
                      Game Over!
                    </h2>
                    <div className="space-y-2">
                      {players.map((player) => (
                        <p
                          key={player.id}
                          className="text-white text-lg [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]"
                        >
                          {player.name}: ${player.score}
                        </p>
                      ))}
                    </div>

                    <Button
                      onClick={() => setGameStarted(false)}
                      className="mt-6 bg-yellow-500 hover:bg-yellow-600"
                    >
                      Return to Menu
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;
