# 역사 게임 연동 설계 (아직 활성화되지 않은 후속 기능)

## 식별자

- room: 8자리 학급 접속 코드
- student.id: UUID, 별명 변경 여부와 독립
- nation.id: n0~n4, 시대가 바뀌어도 지역 연결 유지
- card.id: UUID, 소유권 이동 시 새 인벤토리 묶음 ID 생성
- pending.id: UUID, 요청은 한 번만 승인 가능
- schemaVersion: 1

## 현행 내부 API

POST /api/game: create, info, join, login, request, transfer, tradeAccept, review, support, elect, era, settings, assign, adjust.
GET /api/game: 인증된 방의 현황.
인증: Authorization: Bearer <session>. 학생과 교사 권한은 서버에서 분리.
비밀번호 해시는 응답에 포함하지 않음. 스냅샷도 비밀번호 해시를 포함하지 않음.

## 외부 게임 연결 시 추가할 계약

`POST /api/v1/reward-events` (미구현): eventId, gameId, roomId, studentId, reward, evidence.
서버에서 허용된 gameId·별도 범위 제한 키 검증, eventId UNIQUE 제약으로 중복 지급 차단. 바로 자산을 늘리지 않고 승인 대기 기록 생성. 이벤트 DB와 감사 기록을 별도로 유지. 클라이언트 코드에 관리자 비밀을 넣지 않음.

이 문서의 외부 연동 URL은 설계이며 현재 호출할 수 없습니다.
