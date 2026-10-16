export type JournalArticle = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readingTime: string;
  /** 목록·글 머리 사진 */
  cover?: string;
  /** 블로그 목록 맨 위에 크게 보일 글 (관리자가 하나 고름) */
  featured?: boolean;
  sections: { heading: string; paragraphs: string[] }[];
};

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: "how-landscaping-estimate-works",
    featured: true,
    cover: "/service/work-bed-s.webp",
    category: "견적 안내",
    title: "전원주택 마당 조경견적은 어떻게 계산할까요?",
    excerpt: "전체 정원이 아니라 바꾸고 싶은 공간부터, 조경견적을 살펴볼 때 확인할 항목을 정리했어요.",
    readingTime: "3분 읽기",
    sections: [
      {
        heading: "필요한 공간의 크기부터 확인해요",
        paragraphs: [
          "전원주택 조경은 마당 전체를 한 번에 바꾸는 것보다 현관 앞, 담장 옆, 마당 한편처럼 필요한 공간을 정하는 것에서 시작해요.",
          "정확한 면적을 몰라도 괜찮아요. 사진과 대략적인 크기, 바꾸고 싶은 이유를 알려주면 상담을 통해 필요한 범위를 함께 좁혀갈 수 있어요.",
        ],
      },
      {
        heading: "자재·배송·시공 범위를 나눠 봐요",
        paragraphs: [
          "같은 잔디나 디딤석이라도 자재만 필요한지, 배송과 시공까지 맡길지에 따라 조경견적이 달라져요. 원하는 범위를 먼저 정하면 비교하기가 쉬워집니다.",
          "테두리 조경견적은 자재비와 작업 범위를 나눠 확인할 수 있도록 안내하고, 최종 비용은 현장 상태와 실측을 바탕으로 상담해요.",
        ],
      },
      {
        heading: "사진 한 장으로 먼저 시작할 수 있어요",
        paragraphs: [
          "작업할 곳이 보이는 사진과 희망 시기, 원하는 분위기를 준비해 주세요. 완성된 계획이 없어도 현재 불편한 점을 적어주면 충분해요.",
        ],
      },
    ],
  },
  {
    slug: "lawn-gravel-stepping-stone",
    cover: "/service/work-stone-s.webp",
    category: "자재 선택",
    title: "잔디·자갈·디딤석, 우리 집 마당에 맞는 재료 고르기",
    excerpt: "마당의 용도와 관리 방식에 따라 잔디, 자갈, 디딤석을 고르는 기준을 쉽게 설명해요.",
    readingTime: "4분 읽기",
    sections: [
      {
        heading: "잔디는 넓고 부드러운 공간에 어울려요",
        paragraphs: [
          "아이들이 뛰놀거나 초록 풍경을 넓게 보고 싶다면 잔디가 잘 어울려요. 대신 계절에 따른 관리와 물주기, 햇빛 조건을 함께 살펴야 해요.",
        ],
      },
      {
        heading: "자갈은 관리 부담을 줄이고 싶을 때 좋아요",
        paragraphs: [
          "자갈은 흙이 드러난 공간을 깔끔하게 정리하고 배수감을 살리는 데 도움이 돼요. 경계재와 함께 사용하면 자갈이 주변으로 흘러내리는 것도 줄일 수 있어요.",
        ],
      },
      {
        heading: "디딤석은 이동 동선을 만들어줘요",
        paragraphs: [
          "현관에서 마당이나 창고까지 자주 오가는 길이라면 디딤석이나 판석을 놓아 동선을 만들 수 있어요. 걸음 폭과 주변 배수 상태를 함께 확인하는 것이 중요합니다.",
          "테두리는 전원주택 조경 상담에서 한 가지 재료만 고르기보다 잔디·자갈·디딤석을 공간별로 조합하는 방법도 함께 살펴봐요.",
        ],
      },
    ],
  },
  {
    slug: "small-yard-landscaping-start",
    cover: "/service/work-lawn-s.webp",
    category: "부분조경",
    title: "작은 마당 부분조경, 어디부터 시작할까요?",
    excerpt: "마당 전체 공사가 부담스러운 분을 위해 작은 공간에서 전원주택 조경을 시작하는 순서를 안내해요.",
    readingTime: "3분 읽기",
    sections: [
      {
        heading: "가장 불편한 곳 하나를 골라요",
        paragraphs: [
          "비가 오면 흙을 밟는 현관 앞, 잡초가 반복해서 나는 담장 옆처럼 생활에서 가장 불편한 곳을 먼저 골라보세요.",
          "작은 공간 하나가 정리되면 필요한 관리 방식과 다음에 바꾸고 싶은 공간도 더 분명해져요.",
        ],
      },
      {
        heading: "사용할 사람과 동선을 생각해요",
        paragraphs: [
          "보기 좋은 마당도 실제로 걷기 어렵거나 관리하기 힘들면 오래 유지하기 어려워요. 누가 어떻게 지나가고, 어디에서 머무는지를 먼저 생각하면 재료 선택이 쉬워집니다.",
        ],
      },
      {
        heading: "작게 신청하고 다음을 결정해도 돼요",
        paragraphs: [
          "처음부터 완성된 정원 계획을 만들지 않아도 괜찮아요. 지금 필요한 공간과 예산, 희망 시기를 기준으로 테두리 조경견적을 받아본 뒤 다음 단계를 결정할 수 있어요.",
        ],
      },
    ],
  },
  {
    slug: "prepare-landscaping-estimate",
    cover: "/guide/hero-shot.webp",
    category: "신청 준비",
    title: "조경견적 신청 전에 준비하면 좋은 세 가지",
    excerpt: "사진, 대략적인 크기, 희망 시기만 준비해도 전원주택 조경 상담을 시작할 수 있어요.",
    readingTime: "2분 읽기",
    sections: [
      {
        heading: "작업할 곳이 보이는 사진",
        paragraphs: [
          "가까이 찍은 사진 한 장보다 작업 공간의 앞뒤와 주변 경계가 함께 보이는 사진이 좋아요. 여러 방향에서 찍으면 현장 상황을 이해하는 데 도움이 됩니다.",
        ],
      },
      {
        heading: "대략적인 크기와 현재의 불편함",
        paragraphs: [
          "정확한 도면이 없어도 가로·세로를 대략 적어주세요. 크기를 모르면 사람이나 익숙한 물건을 기준으로 설명해도 괜찮아요.",
          "‘비가 오면 미끄러워요’, ‘잡초 관리가 힘들어요’처럼 현재 불편한 점을 함께 알려주면 필요한 작업을 정하는 데 도움이 됩니다.",
        ],
      },
      {
        heading: "희망 시기와 원하는 범위",
        paragraphs: [
          "가능한 시기와 자재만 필요한지, 배송·시공까지 원하는지 적어주세요. 테두리는 내용을 확인한 뒤 전원주택 조경에 맞는 상담을 안내해요.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string) {
  return JOURNAL_ARTICLES.find((article) => article.slug === slug);
}
