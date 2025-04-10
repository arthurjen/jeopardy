"use client";

import type React from "react";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameButton from "@/components/ui/GameButton";
import FileImportButton from "@/components/ui/FileImportButton";
import PlayerButton from "@/components/ui/PlayerButton";
import GameModal from "@/components/ui/GameModal";
import ModalContent from "@/components/ui/ModalContent";
import QuestionTitle from "@/components/ui/QuestionTitle";
import { Input } from "@/components/ui/input";
import {
  Save,
  Edit2,
  Check,
  Play,
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
      const handleTimesUp = () => {
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
      handleTimesUp();
    }
  }, [attemptedPlayers, players.length, selectedQuestion]);

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
          <PlayerButton
            key={player.id}
            id={player.id}
            name={player.name}
            isSelected={isSelected}
            isDisabled={isDisabled}
            hasAttempted={!isDailyDouble && hasAttempted}
            onClick={setAnsweringPlayer}
          />
        );
      })}
    </div>
  );

  // Render Daily Double wager section
  const renderDailyDoubleWager = () => (
    <ModalContent
      withBorder
      className="mb-6 bg-blue-700 p-4 rounded-lg border border-yellow-400"
    >
      <h3 className="text-yellow-300 text-lg font-bold mb-3 [text-shadow:_0_1px_2px_rgba(0,0,0,0.5)]">
        Daily Double Wager
      </h3>

      {answeringPlayer ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Label className="text-white">
              {players.find((p) => p.id === answeringPlayer)?.name}&apos;s
              Wager:
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
          <GameButton
            variant="yellow"
            onClick={handleWagerSubmit}
            className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold"
          >
            Confirm Wager
          </GameButton>
        </div>
      ) : (
        <div>
          <p className="text-white mb-3">
            Select a player to answer this Daily Double:
          </p>
          {renderPlayerSelection(true)}
        </div>
      )}
    </ModalContent>
  );

  // Add import/export functions before the return statement
  const handleExportQuestions = () => {
    try {
      const exportData = categories.map((category) => ({
        ...category,
        questions: category.questions.map((question) => ({
          id: question.id,
          answer: question.answer,
          question: question.question,
          value: question.value,
        })),
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
                  (q: unknown): boolean =>
                    typeof q === "object" &&
                    q !== null &&
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
          <div
            key="start-screen"
            className="flex flex-col items-center justify-center min-h-[80vh] text-center"
          >
            <div className="max-w-3xl w-full bg-blue-800 rounded-xl shadow-2xl p-8 border-4 border-yellow-400">
              <h1 className="text-white text-6xl font-bold mb-6 tracking-tight [text-shadow:_0_4px_8px_rgba(0,0,0,0.5)]">
                JEOPARDY!
              </h1>
              <p className="text-yellow-300 text-xl mb-6 [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
                Design and host your own Jeopardy game.
              </p>
              <div className="w-full h-1 bg-yellow-400 mb-8"></div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                <GameButton
                  icon={Download}
                  onClick={handleExportQuestions}
                  size="lg"
                >
                  Export
                </GameButton>
                <FileImportButton
                  icon={Upload}
                  onChange={handleImportQuestions}
                  size="lg"
                >
                  Import
                </FileImportButton>
                <GameButton
                  icon={Edit2}
                  variant="yellow"
                  onClick={editGame}
                  size="lg"
                >
                  Edit Game
                </GameButton>
                <GameButton
                  icon={Play}
                  variant="blue"
                  onClick={initializeGame}
                  size="lg"
                >
                  Start Game
                </GameButton>
              </div>
            </div>
          </div>
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
                  <GameButton
                    icon={Download}
                    onClick={handleExportQuestions}
                    size="lg"
                  >
                    Export
                  </GameButton>
                  <FileImportButton
                    icon={Upload}
                    onChange={handleImportQuestions}
                    size="lg"
                  >
                    Import
                  </FileImportButton>
                  <GameButton
                    icon={Check}
                    variant="blue"
                    onClick={finishEditing}
                    size="lg"
                  >
                    Done Editing
                  </GameButton>
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
                <GameModal
                  isOpen={!!selectedQuestion && !editMode}
                  showCloseButton={false}
                  title={
                    <QuestionTitle
                      value={selectedQuestion.value}
                      onTimesUp={handleTimesUp}
                      isDailyDouble={selectedQuestion.isDailyDouble}
                    />
                  }
                >
                  {/* Daily Double Wager Section */}
                  {selectedQuestion.isDailyDouble &&
                    !wagerSubmitted &&
                    renderDailyDoubleWager()}

                  {/* Question Content */}
                  {(!selectedQuestion.isDailyDouble || wagerSubmitted) && (
                    <ModalContent>
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
                          <GameButton
                            variant="yellow"
                            onClick={() => setShowAnswer(true)}
                          >
                            Show Question
                          </GameButton>
                        ) : (
                          <>
                            <GameButton
                              variant="green"
                              onClick={() => handleAnswer(true)}
                              disabled={answeringPlayer === null}
                            >
                              Correct
                            </GameButton>
                            <GameButton
                              variant="red"
                              onClick={() => handleAnswer(false)}
                              disabled={answeringPlayer === null}
                            >
                              Incorrect
                            </GameButton>
                          </>
                        )}
                      </div>
                    </ModalContent>
                  )}
                </GameModal>
              )}
            </AnimatePresence>

            {/* Category Edit Modal */}
            <AnimatePresence>
              {editingCategory && (
                <GameModal
                  isOpen={!!editingCategory}
                  onClose={() => setEditingCategory(null)}
                  title="Edit Category"
                  width="sm"
                >
                  <ModalContent>
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
                      <GameButton
                        variant="green"
                        icon={Save}
                        onClick={saveCategory}
                      >
                        Save Changes
                      </GameButton>
                    </div>
                  </ModalContent>
                </GameModal>
              )}
            </AnimatePresence>

            {/* Question Edit Modal */}
            <AnimatePresence>
              {editingQuestion && (
                <GameModal
                  isOpen={!!editingQuestion}
                  onClose={() => setEditingQuestion(null)}
                  title={
                    editingQuestion &&
                    `${categories[editingQuestion.categoryIndex].title} for $${
                      categories[editingQuestion.categoryIndex].questions[
                        editingQuestion.questionIndex
                      ].value
                    }`
                  }
                >
                  <ModalContent>
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
                      <GameButton
                        variant="green"
                        icon={Save}
                        onClick={saveQuestion}
                      >
                        Save Changes
                      </GameButton>
                    </div>
                  </ModalContent>
                </GameModal>
              )}
            </AnimatePresence>

            {/* Game Over Modal */}
            <AnimatePresence>
              {isGameOver && !editMode && (
                <GameModal
                  isOpen={isGameOver && !editMode}
                  title="Game Over!"
                  showCloseButton={false}
                  centered={true}
                  width="sm"
                >
                  <ModalContent>
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

                    <GameButton
                      variant="yellow"
                      onClick={() => setGameStarted(false)}
                      className="mt-6"
                    >
                      Return to Menu
                    </GameButton>
                  </ModalContent>
                </GameModal>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;
