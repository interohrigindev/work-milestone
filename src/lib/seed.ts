import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { setProject } from './firestore';

const PROJECT_ID = 'sprint-2026-03';

const SEED_TASKS = [
  {
    order: 1, day: 1, dayLabel: 'Day 1: 3/13 (금)', title: '프로젝트 구조 파악 + 라우팅',
    prompt: 'P-01', detail: '구조 분석, 라우트 9개, 사이드바 메뉴, 빈 페이지 8개',
    timeSlot: '오전 9~12', difficulty: '●○○', status: 'pending', progress: 0,
    category: '기반설정', color: '#3498DB', completedAt: null, notes: '',
  },
  {
    order: 2, day: 1, dayLabel: 'Day 1: 3/13 (금)', title: 'Supabase 테이블 생성 (신뢰도 포함)',
    prompt: 'P-02', detail: '채용 9개 + 신뢰도 3개 테이블 + 트리거',
    timeSlot: '오후 1~6', difficulty: '●●○', status: 'pending', progress: 0,
    category: '기반설정', color: '#3498DB', completedAt: null, notes: '',
  },
  {
    order: 3, day: 2, dayLabel: 'Day 2: 3/16 (월)', title: '채용 대시보드 + AI 신뢰도 위젯',
    prompt: 'P-03', detail: '대시보드 레이아웃, 통계 카드, 신뢰도 게이지 위젯',
    timeSlot: '오전 9~12', difficulty: '●●○', status: 'pending', progress: 0,
    category: '채용CRUD', color: '#27AE60', completedAt: null, notes: '',
  },
  {
    order: 4, day: 2, dayLabel: 'Day 2: 3/16 (월)', title: '채용공고 CRUD + AI 질문 생성',
    prompt: 'P-03', detail: '공고 작성/수정/삭제, AI 면접 질문 자동 생성',
    timeSlot: '오후 1~4', difficulty: '●●●', status: 'pending', progress: 0,
    category: '채용CRUD', color: '#27AE60', completedAt: null, notes: '',
  },
  {
    order: 5, day: 2, dayLabel: 'Day 2: 3/16 (월)', title: '사전 질의서 시스템',
    prompt: 'P-04', detail: '지원자 사전 설문, 질의서 템플릿, 응답 수집',
    timeSlot: '오후 4~6', difficulty: '●●○', status: 'pending', progress: 0,
    category: '질의서', color: '#1ABC9C', completedAt: null, notes: '',
  },
  {
    order: 6, day: 3, dayLabel: 'Day 3: 3/17 (화)', title: '면접 녹화 페이지 (웹캠)',
    prompt: 'P-05', detail: 'MediaRecorder API, 웹캠 프리뷰, 녹화/정지/재녹화',
    timeSlot: '오전 9~12', difficulty: '●●●', status: 'pending', progress: 0,
    category: '면접엔진', color: '#F39C12', completedAt: null, notes: '',
  },
  {
    order: 7, day: 3, dayLabel: 'Day 3: 3/17 (화)', title: '음성 분석 엔진 + STT',
    prompt: 'P-06', detail: 'Whisper API 연동, 음성→텍스트 변환, 감정 분석 기초',
    timeSlot: '오후 1~4', difficulty: '●●●', status: 'pending', progress: 0,
    category: '분석엔진', color: '#E74C3C', completedAt: null, notes: '',
  },
  {
    order: 8, day: 3, dayLabel: 'Day 3: 3/17 (화)', title: '녹음/녹화 업로드 기능',
    prompt: 'P-11', detail: 'Supabase Storage 연동, 파일 업로드/다운로드',
    timeSlot: '오후 4~6', difficulty: '●●○', status: 'pending', progress: 0,
    category: '면접엔진', color: '#F39C12', completedAt: null, notes: '',
  },
  {
    order: 9, day: 4, dayLabel: 'Day 4: 3/18 (수)', title: '인재상 매칭 엔진 ★핵심★',
    prompt: 'P-07+08', detail: '기업 인재상 정의, 역량 매핑, AI 매칭 스코어 산출',
    timeSlot: '오전 9~12', difficulty: '●●●', status: 'pending', progress: 0,
    category: '핵심엔진', color: '#8E44AD', completedAt: null, notes: '',
  },
  {
    order: 10, day: 4, dayLabel: 'Day 4: 3/18 (수)', title: 'AI 종합 분석 파이프라인',
    prompt: 'P-08', detail: 'STT + 감정 + 인재상 + 신뢰도 통합 분석 파이프라인',
    timeSlot: '오전 (병렬)', difficulty: '●●●', status: 'pending', progress: 0,
    category: '분석엔진', color: '#E74C3C', completedAt: null, notes: '',
  },
  {
    order: 11, day: 4, dayLabel: 'Day 4: 3/18 (수)', title: '분석 리포트 6탭 페이지',
    prompt: 'P-09', detail: '종합/음성/표정/인재상/신뢰도/비교 6개 탭 리포트',
    timeSlot: '오후 1~6', difficulty: '●●●', status: 'pending', progress: 0,
    category: '채용CRUD', color: '#27AE60', completedAt: null, notes: '',
  },
  {
    order: 12, day: 5, dayLabel: 'Day 5: 3/19 (목)', title: 'AI 신뢰도 대시보드 ★핵심★',
    prompt: 'P-10+14', detail: '신뢰도 점수 시각화, 이상치 탐지, 경고 시스템',
    timeSlot: '오전 9~12', difficulty: '●●●', status: 'pending', progress: 0,
    category: '핵심엔진', color: '#8E44AD', completedAt: null, notes: '',
  },
  {
    order: 13, day: 5, dayLabel: 'Day 5: 3/19 (목)', title: '이메일 + 직원연동 + Phase 판정',
    prompt: 'P-12~14', detail: '이메일 발송, 직원DB 연동, 채용 Phase 자동 판정',
    timeSlot: '오후 1~3', difficulty: '●●○', status: 'pending', progress: 0,
    category: '연동', color: '#1ABC9C', completedAt: null, notes: '',
  },
  {
    order: 14, day: 5, dayLabel: 'Day 5: 3/19 (목)', title: '통합 대시보드 + 반응형 + 배포',
    prompt: 'P-13', detail: '전체 대시보드 통합, 반응형 UI, Vercel/Firebase 배포',
    timeSlot: '오후 3~5', difficulty: '●●○', status: 'pending', progress: 0,
    category: '배포', color: '#3498DB', completedAt: null, notes: '',
  },
  {
    order: 15, day: 5, dayLabel: 'Day 5: 3/19 (목)', title: '실전 테스트 + 최종 점검',
    prompt: '—', detail: '전체 기능 테스트, 버그 수정, 최종 QA 체크리스트',
    timeSlot: '오후 5~6', difficulty: '●●○', status: 'pending', progress: 0,
    category: 'QA', color: '#BDC3C7', completedAt: null, notes: '',
  },
];

export async function seedProject(): Promise<string> {
  // Check if tasks already exist
  const tasksSnap = await getDocs(collection(db, 'projects', PROJECT_ID, 'tasks'));
  if (!tasksSnap.empty) {
    throw new Error('이미 초기 데이터가 존재합니다.');
  }

  // Create project doc
  await setProject(PROJECT_ID, {
    title: 'INTEROHRIGIN AI 채용관리 시스템',
    subtitle: '기존 인사평가 통합 확장 | 5일 집중 스프린트',
    startDate: '2026-03-13',
    endDate: '2026-03-19',
    overallProgress: 0,
    currentPhase: '준비중',
    githubRepo: '',
    createdBy: '',
    collaborators: [],
  });

  // Create tasks
  const tasksCol = collection(db, 'projects', PROJECT_ID, 'tasks');
  for (const task of SEED_TASKS) {
    await addDoc(tasksCol, task);
  }

  // Create sample daily log
  await addDoc(collection(db, 'projects', PROJECT_ID, 'dailyLogs'), {
    date: '2026-03-13',
    day: 1,
    content: '프로젝트 킥오프. 기존 코드 구조 분석 완료, DB 설계 착수.',
    achievements: [],
    blockers: [],
    tomorrowPlan: '프로젝트 구조 파악 + Supabase 테이블 생성',
    createdAt: serverTimestamp(),
  });

  return PROJECT_ID;
}

export const DEFAULT_PROJECT_ID = PROJECT_ID;
