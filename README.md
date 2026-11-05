# 몰락한 기업 TOP3 — 3분 해설 영상 (Remotion)

참고 영상(더 머니북 「바가지 관광지 몰락 TOP7」)의 형식을 따라 만든 3분짜리 해설 영상 프로젝트입니다.

- 배경: 대본 내용에 맞는 Wikimedia Commons 무료(CC0/퍼블릭 도메인/CC BY/CC BY-SA) 사진, 느린 줌·패닝
- 전경: Remotion 모션그래픽 (순위 카드, 테이프 붙은 사진 카드, 수치 박스, 도넛·막대 차트, 타임라인, 구독 버튼)
- 자막: 화면 중앙의 굵은 흰 글씨 + 진한 외곽선, 핵심어 빨간색 강조, 왼쪽 위 "N위 이름" 라벨, 왼쪽 아래 출처 표기
- 내레이션: ElevenLabs `eleven_v4`, 목소리 "Taehyung"
- 배경음: Kevin MacLeod 두 곡을 순위가 바뀔 때마다 번갈아 사용

## 다시 만들기

```bash
npm install
python3 scripts/tts.py            # 대본 → 음성 + 글자별 타이밍 (ElevenLabs 키는 환경의 네트워크 시크릿으로 주입)
python3 scripts/fetch_images.py   # content/images.json 의 사진 다운로드 + 크레딧 기록
python3 scripts/build_timeline.py # 자막/그래픽/배경 타이밍 계산 → src/timeline.json
npx remotion studio               # 미리보기
npx remotion render Main out/video.mp4
```

주제를 바꾸려면 `content/script.json`(대본, 강조어, 그래픽 큐)과 `content/images.json`(사진 목록)만 고치면 됩니다.
그래픽은 대본 속 `at` 문구가 읽히는 순간에 나타납니다.

## 크레딧

사진별 작가·라이선스는 `content/credits.json`에 있고, 영상 왼쪽 아래에도 표시됩니다. 유튜브 설명란용 문구는 `CREDITS.md`를 쓰세요.
