"use client";

import { useState } from "react";
import {
  Accordion,
  Badge,
  BottomSheet,
  Button,
  Callout,
  Checkbox,
  Chip,
  Dialog,
  EmptyState,
  Fab,
  Icon,
  IconButton,
  ListItem,
  OptionBox,
  Progress,
  RadioGroup,
  Segmented,
  Select,
  StatusBadge,
  Stepper,
  Steps,
  Switch,
  Tabs,
  TextField,
  Tooltip,
  useToast,
  type QuoteStatus,
} from "../_components/ui";

const COLORS: [string, string, string][] = [
  ["#12873B", "primary · green-600", "버튼 바탕 (흰 글자 4.6:1)"],
  ["#1DA049", "green-brand", "로고 · 선택 표시 · 테두리 선"],
  ["#EBF7EE", "green-50", "옅은 버튼 · 선택 배경"],
  ["#16231B", "gray-900", "본문 · 어두운 버튼 · 토스트"],
  ["#4E5A53", "gray-600", "설명 글자"],
  ["#6B756F", "gray-500", "보조 안내"],
  ["#C9CFCA", "gray-300", "입력칸 테두리"],
  ["#E2E6E1", "gray-200", "구분선"],
  ["#F1F3F0", "gray-100", "회색 버튼 · 칸 바탕"],
  ["#D93A2B", "danger", "오류"],
];

const STATUSES: QuoteStatus[] = ["received", "checking", "needs", "quoted", "done", "canceled"];

function Block({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="sc-block">
      <header className="sc-block__head">
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </header>
      {children}
    </section>
  );
}

function Cell({ label, desc, children, wide }: { label: string; desc?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`sc-cell${wide ? " sc-cell--wide" : ""}`}>
      <p className="sc-cell__label">{label}</p>
      {desc && <p className="sc-cell__desc">{desc}</p>}
      <div className="sc-cell__body">{children}</div>
    </div>
  );
}

/** 컴포넌트만으로 조립한 '내 신청' 모바일 화면 */
function PhonePreview() {
  const [tab, setTab] = useState<"all" | "going" | "done">("all");
  return (
    <div className="sc-phone">
      <div className="sc-phone__bar">
        <IconButton icon="arrowLeft" label="뒤로" size="sm" />
        <strong>내 신청</strong>
        <IconButton icon="bell" label="알림" size="sm" badge={2} />
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "전체", count: 3 },
          { value: "going", label: "진행 중", count: 2 },
          { value: "done", label: "완료" },
        ]}
      />
      <div className="sc-phone__body">
        <Callout tone="warning" title="사진 보완이 필요해요">
          현관 쪽 사진을 한 장 더 보내주시면 견적이 빨라져요.
        </Callout>
        <div className="ui-list">
          <ListItem icon="leaf" title="디딤석 · 화단" detail="TD-2610-0012 · 경기 양평군" suffix={<StatusBadge status="quoted" />} />
          <ListItem icon="leaf" title="잔디" detail="TD-2610-0009 · 경기 가평군" suffix={<StatusBadge status="needs" />} />
          <ListItem icon="leaf" title="자갈 · 식재" detail="TD-2609-0031 · 인천 강화군" suffix={<StatusBadge status="done" />} />
        </div>
      </div>
      <div className="ui-action-bar">
        <IconButton icon="chat" label="문의하기" variant="outline" />
        <Button size="m">새 견적 신청</Button>
      </div>
      <p className="sc-phone__note">구성 예시 화면이에요. 접수번호와 지역은 예시 값이에요.</p>
    </div>
  );
}

export function Showcase() {
  const [seg, setSeg] = useState<"list" | "map">("list");
  const [chips, setChips] = useState<string[]>(["디딤석"]);
  const [opt, setOpt] = useState("시공까지");
  const [agree, setAgree] = useState(true);
  const [partial, setPartial] = useState(false);
  const [radio, setRadio] = useState<"fast" | "month" | "later">("month");
  const [notify, setNotify] = useState(true);
  const [kakao, setKakao] = useState(false);
  const [count, setCount] = useState(2);
  const [email, setEmail] = useState("hello@example.com");
  const [code, setCode] = useState("12");
  const [wish, setWish] = useState("");
  const [region, setRegion] = useState("경기");
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState<"a" | "b" | "c">("a");
  const toast = useToast();

  return (
    <div className="sc">
      <div className="sc-intro">
        <div>
          <h1 className="title-l">테두리 디자인 시스템 v2</h1>
          <p className="lead">평평하고 또렷하게. 조경이 주인공이고, 화면 부품은 차분하게 제 역할만 해요.</p>
          <ul className="sc-rules">
            <li>
              <Icon name="check" /> 그림자는 팝업·시트·토스트처럼 떠 있는 것에만
            </li>
            <li>
              <Icon name="check" /> 초록은 행동(버튼)과 선택에만. 초록 위 글자는 흰색
            </li>
            <li>
              <Icon name="check" /> 모서리: 버튼 6 · 입력 8 · 카드 12 · 칩 pill
            </li>
            <li>
              <Icon name="check" /> 고유 지표: 견적 진행 상태 배지
            </li>
          </ul>
        </div>
        <PhonePreview />
      </div>

      <Block title="색" sub="회색 9단계 + 초록 4단계 + 오류">
        <ul className="sc-colors">
          {COLORS.map(([hex, name, role]) => (
            <li key={name}>
              <span style={{ background: hex }} />
              <strong>{hex}</strong>
              <code>{name}</code>
              <em>{role}</em>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="버튼" sub="주 · 옅은 · 테두리 · 글자 · 어두운 · 회색 / 크기 32 · 44 · 52">
        <div className="sc-grid">
          <Cell label="종류" wide>
            <div className="sc-row">
              <Button>견적 요청</Button>
              <Button variant="soft">사진 추가</Button>
              <Button variant="outline">임시 저장</Button>
              <Button variant="ghost">건너뛰기</Button>
              <Button variant="neutral">상담 예약</Button>
              <Button variant="gray">취소</Button>
              <Button disabled>비활성</Button>
            </div>
          </Cell>
          <Cell label="크기">
            <div className="sc-row">
              <Button size="xs">XS · 32</Button>
              <Button size="m">M · 44</Button>
              <Button size="l">L · 52</Button>
            </div>
          </Cell>
          <Cell label="아이콘과 함께">
            <div className="sc-row">
              <Button icon="photo" variant="soft" size="m">
                사진 올리기
              </Button>
              <Button icon="chat" variant="outline" size="m">
                문의하기
              </Button>
            </div>
          </Cell>
          <Cell label="꽉 찬 버튼 (모바일 하단)" wide>
            <Button block>이 조합으로 무료 견적 요청</Button>
          </Cell>
          <Cell label="아이콘 버튼" desc="기본 · 옅은 · 채움 · 테두리 · 배지">
            <div className="sc-row">
              <IconButton icon="search" label="검색" />
              <IconButton icon="photo" label="사진" variant="fill" />
              <IconButton icon="plus" label="추가" variant="solid" />
              <IconButton icon="heart" label="관심" variant="outline" />
              <IconButton icon="bell" label="알림" badge={3} />
              <IconButton icon="chat" label="대화" badge="dot" />
            </div>
          </Cell>
          <Cell label="떠 있는 버튼 · 세그먼트">
            <div className="sc-row">
              <Fab>새 신청</Fab>
              <Segmented
                label="보기 방식"
                value={seg}
                onChange={setSeg}
                options={[
                  { value: "list", label: "목록" },
                  { value: "map", label: "지도" },
                ]}
              />
            </div>
          </Cell>
        </div>
      </Block>

      <Block title="선택 · 입력" sub="칩 · 선택 상자 · 체크박스 · 라디오 · 스위치 · 수량 · 입력칸">
        <div className="sc-grid">
          <Cell label="필터 칩" desc="여러 개 선택">
            <div className="sc-row">
              {["디딤석", "잔디", "자갈", "화단", "식재"].map((c) => (
                <Chip key={c} selected={chips.includes(c)} onClick={() => setChips((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))}>
                  {c}
                </Chip>
              ))}
              <Chip disabled>기타</Chip>
            </div>
          </Cell>
          <Cell label="선택 상자" desc="견적 질문의 답">
            <div className="sc-col">
              {[
                ["자재만", "직접 가꾸고 싶을 때"],
                ["시공까지", "작업까지 맡기고 싶을 때"],
              ].map(([t, d]) => (
                <OptionBox key={t} title={t} desc={d} selected={opt === t} onClick={() => setOpt(t)} />
              ))}
            </div>
          </Cell>
          <Cell label="체크박스 · 라디오">
            <div className="sc-col">
              <Checkbox label="개인정보 수집·이용 동의 (필수)" checked={agree} onChange={setAgree} />
              <Checkbox label="전체 동의" checked={false} indeterminate={!partial} onChange={setPartial} />
              <Checkbox label="비활성" checked={false} disabled onChange={() => {}} />
              <RadioGroup
                name="timing"
                value={radio}
                onChange={setRadio}
                options={[
                  { value: "fast", label: "가능한 빠르게" },
                  { value: "month", label: "한 달 안에" },
                  { value: "later", label: "일정은 상담 후" },
                ]}
              />
            </div>
          </Cell>
          <Cell label="스위치 · 수량">
            <div className="sc-col">
              <Switch label="진행 알림 메일" desc="견적이 오면 바로 알려드려요" checked={notify} onChange={setNotify} />
              <Switch label="카카오톡 알림" checked={kakao} onChange={setKakao} />
              <div className="sc-row">
                <span className="note">나무 수량</span>
                <Stepper label="나무 수량" value={count} min={0} max={10} onChange={setCount} />
              </div>
            </div>
          </Cell>
          <Cell label="입력칸" desc="박스형 · 지우기 · 밑줄형 · 오류와 글자 수">
            <div className="sc-col">
              <TextField label="안내받을 이메일" required value={email} onChange={setEmail} clearable helper="접수 결과와 견적을 보내드려요." />
              <TextField label="확인 코드" required value={code} onChange={setCode} maxLength={6} error={code.length < 6 ? "메일로 받은 6자리를 입력해주세요." : undefined} variant="line" />
            </div>
          </Cell>
          <Cell label="여러 줄 · 드롭다운 · 비활성">
            <div className="sc-col">
              <TextField label="원하는 모습" value={wish} onChange={setWish} multiline maxLength={300} placeholder="예: 비가 오면 현관 앞 흙을 밟게 돼요." />
              <Select label="사는 지역" value={region} onChange={setRegion} options={["서울", "경기", "인천"]} />
              <TextField label="접수번호" value="TD-2610-0012" onChange={() => {}} disabled />
            </div>
          </Cell>
        </div>
      </Block>

      <Block title="상태 · 안내" sub="테두리 고유 지표 · 안내 배너 · 진행 · 툴팁 · 토스트 · 빈 화면">
        <div className="sc-grid">
          <Cell label="견적 진행 상태" desc="테두리만의 지표. 신청 목록과 상세에서 계속 써요" wide>
            <div className="sc-row">
              {STATUSES.map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
          </Cell>
          <Cell label="안내 배너" wide>
            <div className="sc-grid2">
              <Callout tone="info" title="정확한 주소는 지금 받지 않아요">
                시·군·구까지만 알려주세요.
              </Callout>
              <Callout tone="success" title="견적이 도착했어요">
                자재비·배송비·시공비를 확인해보세요.
              </Callout>
              <Callout tone="warning" title="사진 보완이 필요해요">
                현관 쪽 사진을 한 장 더 보내주세요.
              </Callout>
              <Callout tone="danger" title="사진을 올리지 못했어요">
                JPG·PNG로 바꿔 다시 시도해주세요.
              </Callout>
            </div>
          </Cell>
          <Cell label="진행 표시">
            <div className="sc-col">
              <Progress value={58} label="견적 신청 진행" />
              <Steps items={["접수", "확인", "견적", "결정"]} current={2} />
            </div>
          </Cell>
          <Cell label="툴팁 · 토스트 · 배지">
            <div className="sc-row">
              <Tooltip text="운영자가 24시간 안에 확인해요">
                <IconButton icon="info" label="도움말" variant="outline" />
              </Tooltip>
              <Button
                size="m"
                variant="neutral"
                onClick={() => toast.show({ msg: "신청 내용을 저장했어요", action: { label: "실행 취소", run: () => {} } })}
              >
                토스트 보기
              </Button>
              <span className="ui-badge-wrap">
                <span className="tag tag--line">새 견적</span>
                <Badge value={12} />
              </span>
            </div>
          </Cell>
          <Cell label="빈 화면" wide>
            <EmptyState icon="file" title="아직 신청한 견적이 없어요" desc="바꾸고 싶은 곳부터 가볍게 요청해보세요." action={<Button size="m">무료 견적 시작하기</Button>} />
          </Cell>
        </div>
      </Block>

      <Block title="떠 있는 요소 · 탐색" sub="팝업 · 바텀시트 · 탭 · 목록 · 아코디언">
        <div className="sc-grid">
          <Cell label="팝업 · 바텀시트">
            <div className="sc-row">
              <Button size="m" variant="outline" onClick={() => setDialog(true)}>
                팝업 열기
              </Button>
              <Button size="m" variant="outline" onClick={() => setSheet(true)}>
                바텀시트 열기
              </Button>
            </div>
          </Cell>
          <Cell label="탭">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "a", label: "신청 내용" },
                { value: "b", label: "견적", count: 1 },
                { value: "c", label: "문의 기록" },
              ]}
            />
          </Cell>
          <Cell label="목록 항목" desc="앞 아이콘 · 제목 · 설명 · 뒤 요소" wide>
            <div className="ui-list">
              <ListItem icon="file" title="견적 상세" detail="자재비 · 배송비 · 시공비" suffix={<StatusBadge status="quoted" />} />
              <ListItem icon="chat" title="문의하기" detail="접수 메일에 회신해도 돼요" />
            </div>
          </Cell>
          <Cell label="아코디언 (자주 묻는 질문)" wide>
            <Accordion
              items={[
                { q: "무엇을 바꿀지 정확히 모르겠어요.", a: "현재 상태와 원하는 모습을 적어주세요. 운영자가 함께 정리해드려요." },
                { q: "신청 내용을 바꾸거나 취소하려면요?", a: "접수 메일에 회신하거나 문의하기로 알려주세요." },
              ]}
            />
          </Cell>
        </div>
      </Block>

      <Dialog
        open={dialog}
        title="신청을 취소할까요?"
        desc="취소하면 이 신청으로는 견적을 받을 수 없어요."
        confirm="취소하기"
        cancel="닫기"
        onConfirm={() => {
          setDialog(false);
          toast.show({ msg: "신청을 취소했어요" });
        }}
        onClose={() => setDialog(false)}
      />
      <BottomSheet
        open={sheet}
        title="어떻게 보완할까요?"
        items={["사진 더 올리기", "크기 다시 적기", "운영자에게 문의"]}
        onSelect={(v) => {
          setSheet(false);
          toast.show({ msg: `‘${v}’를 골랐어요` });
        }}
        onClose={() => setSheet(false)}
      />
      {toast.node}
    </div>
  );
}
