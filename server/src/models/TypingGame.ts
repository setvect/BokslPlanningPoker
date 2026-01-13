import { readFileSync } from 'fs';
import { join } from 'path';
import { TypingRoomInternal, TypingRoomUtils } from './TypingRoom';
import { TypingPlayerInternal, TypingPlayerUtils } from './TypingPlayer';
import { TypingSentence, TypingRoundResult, TypingPlayerRanking, TypingGameState } from '../../../shared/types';
import { TYPING_GAME_CONFIG, TYPING_SPECIAL_CHARS } from '../../../shared/constants';

// 문장 데이터 타입
interface SentenceData {
  id: number;
  text: string;
}

// 텍스트 파일에서 문장 로드
function loadSentences(): SentenceData[] {
  const filePath = join(__dirname, '../../../shared/data/typing-sentences.txt');
  const content = readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))
    .map((text, index) => ({
      id: index + 1,
      text,
    }));
}

const sentences: SentenceData[] = loadSentences();

// 타자 게임 로직
export class TypingGame {
  private room: TypingRoomInternal;
  private static sentences: SentenceData[] = sentences;

  constructor(room: TypingRoomInternal) {
    this.room = room;
  }

  /**
   * 랜덤 문장 선택 (이전 문장 제외)
   */
  static getRandomSentence(excludeId?: number | null): TypingSentence {
    const available = TypingGame.sentences.filter(s => s.id !== excludeId);
    const selectedData = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : TypingGame.sentences[0];

    return {
      id: selectedData.id,
      text: selectedData.text,
      displayText: TypingGame.addSpecialChars(selectedData.text),
      length: selectedData.text.length,
    };
  }

  /**
   * 띄어쓰기에 특수 문자 추가 (복사 방지용)
   */
  private static addSpecialChars(text: string): string {
    return text.split(' ').join(` ${TYPING_SPECIAL_CHARS[Math.floor(Math.random() * TYPING_SPECIAL_CHARS.length)]} `);
  }

  /**
   * 타이핑 입력 처리
   */
  processInput(playerId: string, input: string): {
    player: TypingPlayerInternal;
    progress: number;
    errorPositions: number[];
  } | null {
    if (this.room.gameState !== TypingGameState.PLAYING) {
      return null;
    }

    const player = this.room.players.get(playerId);
    if (!player || player.isSpectator || player.isFinished) {
      return null;
    }

    const sentence = this.room.currentSentence;
    if (!sentence) {
      return null;
    }

    // 이전 입력값 가져오기
    const previousInput = this.room.previousInputs.get(playerId) || '';

    // 진행률 및 오타 위치 계산
    const { progress, errorPositions } = this.calculateProgress(input, sentence.text, previousInput);

    // 현재 입력값을 이전 입력값으로 저장
    this.room.previousInputs.set(playerId, input);

    // 참가자 상태 업데이트
    TypingPlayerUtils.updateInput(player, input, progress);

    return { player, progress, errorPositions };
  }

  /**
   * 진행률 및 오타 위치 계산
   */
  calculateProgress(input: string, target: string, previousInput: string): {
    progress: number;
    errorPositions: number[];
  } {
    const errorPositions: number[] = [];
    let correctChars = 0;

    for (let i = 0; i < input.length && i < target.length; i++) {
      if (input[i] === target[i]) {
        correctChars++;
      } else {
        errorPositions.push(i);
      }
    }

    // 입력이 타겟보다 길면 초과 부분도 오타로 처리
    for (let i = target.length; i < input.length; i++) {
      errorPositions.push(i);
    }

    const progress = target.length > 0
      ? Math.min(100, Math.round((correctChars / target.length) * 100))
      : 0;

    return { progress, errorPositions };
  }

  /**
   * 입력 완료 검증 (오타 없이 완전히 일치하는지)
   */
  validateCompletion(input: string): boolean {
    const sentence = this.room.currentSentence;
    if (!sentence) {
      return false;
    }
    return input === sentence.text;
  }

  /**
   * 오타가 있는지 확인
   */
  hasErrors(playerId: string, input: string): boolean {
    const sentence = this.room.currentSentence;
    if (!sentence) {
      return true;
    }

    const previousInput = this.room.previousInputs.get(playerId) || '';
    const { errorPositions } = this.calculateProgress(input, sentence.text, previousInput);
    return errorPositions.length > 0 || input.length !== sentence.text.length;
  }

  /**
   * 참가자 완료 처리
   */
  markPlayerFinished(playerId: string): {
    rank: number;
    timeMs: number;
    isFirstFinisher: boolean;
  } | null {
    const player = this.room.players.get(playerId);
    if (!player || player.isFinished || player.isSpectator) {
      return null;
    }

    const isFirstFinisher = this.room.firstFinisherId === null;
    const rank = TypingRoomUtils.getNextRank(this.room);

    // 참가자 완료 처리
    TypingPlayerUtils.markFinished(player, rank);

    // 1등이면 방에 기록
    if (isFirstFinisher) {
      TypingRoomUtils.setFirstFinisher(this.room, playerId);
    }

    // 완료 시간 계산
    const timeMs = this.room.roundStartedAt && player.finishedAt
      ? player.finishedAt.getTime() - this.room.roundStartedAt.getTime()
      : 0;

    return { rank, timeMs, isFirstFinisher };
  }

  /**
   * 라운드 결과 계산
   */
  calculateRoundResult(): TypingRoundResult {
    TypingRoomUtils.calculateRankings(this.room);

    const rankings: TypingPlayerRanking[] = Array.from(this.room.players.values())
      .filter(p => !p.isSpectator)
      .sort((a, b) => (a.rank || 999) - (b.rank || 999))
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        rank: player.rank || 0,
        finishedAt: player.finishedAt?.toISOString() || null,
        timeMs: player.finishedAt && this.room.roundStartedAt
          ? player.finishedAt.getTime() - this.room.roundStartedAt.getTime()
          : null,
        isFinished: player.isFinished,
      }));

    return {
      roundNumber: this.room.roundNumber,
      sentence: this.room.currentSentence!,
      rankings,
      startedAt: this.room.roundStartedAt?.toISOString() || new Date().toISOString(),
      endedAt: new Date().toISOString(),
    };
  }

  /**
   * 복사 붙여넣기 감지
   */
  static detectPaste(previousInput: string, newInput: string): boolean {
    // 한 번에 threshold 글자 이상 증가하면 붙여넣기로 판단
    return newInput.length - previousInput.length > TYPING_GAME_CONFIG.PASTE_DETECTION_THRESHOLD;
  }
}
