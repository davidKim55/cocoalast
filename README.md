# 몰락한 기업 TOP3 — 3분 해설 영상 (Remotion)

참고 영상(더 머니북 「바가지 관광지 몰락 TOP7」)의 형식을 따라 만든 3분짜리 해설 영상 프로젝트입니다.

- 배경: 대본 내용에 맞는 Wikimedia Commons 무료(CC0/CC BY/CC BY-SA) 사진 27장 + 영상 클립 2개(VHS 기계, 필름 카메라), 직접 생성한 VHS 노이즈 화면
- 화면 문법(참고 영상 1초 단위 분석 기준): 배경은 한 번에 하나(전체 화면 사진·영상 / 테이프 붙은 사진 카드 + 같은 사진 흐린 배경 / 순위판 / 노란 순위 표지)
- 글자도 한 번에 하나: 아래 한 줄 자막(기본) / 가운데 판정·요약 문구(빨강=나쁜 것, 노랑=사람·숫자) / 따옴표 인용(흰색=회사 쪽, 하늘색=도전자·손님 쪽) / 숫자 카드(노랑=정점, 빨강=손실, 빨간 딱지)
- 왼쪽 위 "N위 이름" 라벨, 왼쪽 아래 출처 표기
- 내레이션: ElevenLabs `eleven_v4`, 목소리 "Taehyung"
- 배경음: Kevin MacLeod 두 곡을 순위가 바뀔 때마다 번갈아 사용

## 다시 만들기

```bash
npm install
python3 scripts/tts.py            # 대본 → 음성 + 글자별 타이밍 (ElevenLabs 키는 환경의 네트워크 시크릿으로 주입)
python3 scripts/fetch_images.py   # content/images.json 의 사진 다운로드 + 크레딧 기록
python3 scripts/fetch_videos.py   # content/videos.json 의 영상 클립 (Wikimedia 요청 제한이 심하면 재시도 필요)
python3 scripts/build_timeline.py # 자막/그래픽/배경 타이밍 계산 → src/timeline.json
npx remotion studio               # 미리보기
npx remotion render Main out/video.mp4
```

주제를 바꾸려면 `content/script.json`(대본 `text`, 화면 `visuals`, 글자 `texts`, 순위판 `board`)과 `content/images.json`(사진 목록)만 고치면 됩니다.
각 화면·글자는 대본 속 `at` 문구가 읽히는 순간에 나타나고, 글자는 그 문장이 끝날 때 사라집니다. 강조색은 `[r:빨강]`, `[y:노랑]`, `[b:하늘색]`으로 씁니다.

완성본(1920×1080, 30fps, 3:00, -14 LUFS)은 GitHub 용량 제한 때문에 저장소에 넣지 않았습니다. 위 명령으로 다시 렌더링할 수 있습니다.

## 크레딧

사진별 작가·라이선스는 `content/credits.json`에 있고, 영상 왼쪽 아래에도 표시됩니다. 유튜브 설명란용 문구는 `CREDITS.md`를 쓰세요.
