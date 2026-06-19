import type { Question } from "@/types/question";
import { JAPAN_PIN } from "@/data/maps/japanPinCoords";

export const g3Questions: Question[] = [
  {
    id: "g3_u1_q001",
    unit_id: "g3_u1",
    type: "map_pin",
    difficulty: 1,
    question: {
      text: "地図を見て、市役所（市）や図書館（図）など公共施設が集まっているエリアをタップしよう。",
      choices: [],
      map: {
        map_id: "city_district",
        regions: [
          { id: "center", label: "中心部（公共施設）", x: 50, y: 50 },
          { id: "north", label: "北部（田んぼ）", x: 50, y: 18 },
          { id: "south", label: "南部（住宅）", x: 40, y: 82 },
          { id: "east", label: "東部（工場）", x: 82, y: 55 },
        ],
      },
    },
    answer: { correct_ids: ["center"] },
    explanation: {
      short: "市役所や図書館などは、市民の生活を支える公共施設として中心部などに置かれています。",
      source_note: "学習指導要領解説 第3章 第3学年 (1)",
    },
    curriculum_ref: { grade: 3, unit_number: 1, learning_point: "公共施設" },
    hint: "人々が役所の手続きや本を読むために行く場所を考えよう。",
    tags: ["地図", "公共施設"],
  },
  {
    id: "g3_u1_q002",
    unit_id: "g3_u1",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "地図上の記号「文」が示す施設はどれですか？",
      choices: [
        { id: "a", text: "小学校" },
        { id: "b", text: "消防署" },
        { id: "c", text: "病院" },
        { id: "d", text: "銀行" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "地図記号「文」は学校（小学校など）を表します。",
    },
    curriculum_ref: { grade: 3, unit_number: 1, learning_point: "地図記号" },
    hint: "毎日通っているところを思い出そう。",
    tags: ["地図記号"],
  },
  {
    id: "g3_u1_q003",
    unit_id: "g3_u1",
    type: "map_pin",
    difficulty: 2,
    question: {
      text: "地図で「田」の記号がたくさんある、田んぼが広がるエリアをタップしよう。",
      choices: [],
      map: {
        map_id: "city_district",
        regions: [
          { id: "center", label: "中心部（公共施設）", x: 50, y: 50 },
          { id: "north", label: "北部（田んぼ）", x: 50, y: 18 },
          { id: "south", label: "南部（住宅）", x: 40, y: 82 },
          { id: "east", label: "東部（工場）", x: 82, y: 55 },
        ],
      },
    },
    answer: { correct_ids: ["north"] },
    explanation: {
      short: "地図記号「田」は田んぼを表します。北部には米や野菜を育てる田んぼがあります。",
    },
    curriculum_ref: { grade: 3, unit_number: 1, learning_point: "地図記号・田" },
    hint: "凡例の「田」を見て、地図の上の方を探そう。",
    tags: ["地図", "地図記号"],
  },
  {
    id: "g3_u3_q001",
    unit_id: "g3_u3",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "火事が起きたとき、最初に頼るべき機関はどれですか？",
      choices: [
        { id: "a", text: "消防署" },
        { id: "b", text: "市役所の税務課" },
        { id: "c", text: "郵便局" },
        { id: "d", text: "博物館" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "消防署は火事や救急など、地域の安全を守る働きをしています。",
    },
    curriculum_ref: { grade: 3, unit_number: 3, learning_point: "消防" },
    hint: "119番に電話するところを考えよう。",
  },
  {
    id: "g3_u3_q002",
    unit_id: "g3_u3",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "地震の備えとして正しいものはどれですか？",
      choices: [
        { id: "a", text: "家具の固定や非常袋の準備" },
        { id: "b", text: "窓を開けっ放しにする" },
        { id: "c", text: "高い棚の上に重いものを置く" },
        { id: "d", text: "避難場所を調べない" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "家具の固定や非常袋の準備は、地震から身を守る大切な備えです。",
    },
    curriculum_ref: { grade: 3, unit_number: 3, learning_point: "防災" },
    hint: "学校で防災の学習をしたことを思い出そう。",
  },
  {
    id: "g3_u4_q001",
    unit_id: "g3_u4",
    type: "sort_order",
    difficulty: 2,
    question: {
      text: "市の人口が増えてきた順番に並べ替えよう。",
      choices: [],
      sort_items: [
        { id: "s1", text: "100人の小さな村" },
        { id: "s2", text: "5000人の町" },
        { id: "s3", text: "10万人の市" },
      ],
    },
    answer: { correct_ids: ["s1", "s2", "s3"] },
    explanation: {
      short: "市の様子は、人口や建物、くらし方などが時代とともに変化していきます。",
    },
    curriculum_ref: { grade: 3, unit_number: 4, learning_point: "人口の変化" },
    hint: "少ない→多いの順番だよ。",
  },
  {
    id: "g3_u4_q002",
    unit_id: "g3_u4",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "昔のくらしと今のくらしの違いとして正しいものはどれですか？",
      choices: [
        { id: "a", text: "今は電気や水道が使いやすくなった" },
        { id: "b", text: "昔のほうが必ず自動車が多かった" },
        { id: "c", text: "今はスーパーがなかった" },
        { id: "d", text: "昔からインターネットがあった" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "電気や水道などの普及で、人々のくらしは便利になってきました。",
    },
    curriculum_ref: { grade: 3, unit_number: 4, learning_point: "くらしの変化" },
    hint: "おじいちゃん・おばあちゃんの幼少期と比べてみよう。",
  },
];

export const g4Questions: Question[] = [
  {
    id: "g4_u1_q001",
    unit_id: "g4_u1",
    type: "map_pin",
    difficulty: 1,
    question: {
      text: "日本地図で「北海道」の位置をタップしよう。",
      choices: [],
      map: {
        map_id: "japan_prefectures",
        regions: [
          JAPAN_PIN.hokkaido,
          JAPAN_PIN.tohoku,
          JAPAN_PIN.kanto,
          JAPAN_PIN.kinki,
          JAPAN_PIN.kyushu,
        ],
      },
    },
    answer: { correct_ids: ["hokkaido"] },
    explanation: {
      short: "北海道は日本の最北にある大きな島です。47都道府県の一つです。",
      source_note: "学習指導要領解説 第4章 第4学年 (1)",
    },
    curriculum_ref: { grade: 4, unit_number: 1, learning_point: "位置" },
    hint: "日本で一番北にある大きな島だよ。",
    tags: ["地図", "都道府県"],
  },
  {
    id: "g4_u1_q002",
    unit_id: "g4_u1",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "日本は全部でいくつの都道府県でできていますか？",
      choices: [
        { id: "a", text: "47都道府県" },
        { id: "b", text: "50都道府県" },
        { id: "c", text: "43都道府県" },
        { id: "d", text: "31都道府県" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "日本は1都（東京）、1道（北海道）、2府（大阪・京都）、43県の計47都道府県で構成されています。",
    },
    curriculum_ref: { grade: 4, unit_number: 1, learning_point: "47都道府県" },
    hint: "四十七都道府県の「47」を思い出そう。",
  },
  {
    id: "g4_u1_q003",
    unit_id: "g4_u1",
    type: "map_pin",
    difficulty: 1,
    question: {
      text: "日本地図で「関東」の位置をタップしよう。",
      choices: [],
      map: {
        map_id: "japan_prefectures",
        regions: [
          JAPAN_PIN.hokkaido,
          JAPAN_PIN.tohoku,
          JAPAN_PIN.kanto,
          JAPAN_PIN.kyushu,
        ],
      },
    },
    answer: { correct_ids: ["kanto"] },
    explanation: {
      short: "関東は本州の中央部に位置し、東京・神奈川・埼玉などの都県があります。",
    },
    curriculum_ref: { grade: 4, unit_number: 1, learning_point: "位置" },
    hint: "東京がある地方だよ。",
    tags: ["地図", "都道府県"],
  },
  {
    id: "g4_u1_q004",
    unit_id: "g4_u1",
    type: "map_pin",
    difficulty: 2,
    question: {
      text: "日本地図で「四国」の位置をタップしよう。",
      choices: [],
      map: {
        map_id: "japan_prefectures",
        regions: [
          JAPAN_PIN.kinki,
          JAPAN_PIN.chubu,
          JAPAN_PIN.shikoku,
          JAPAN_PIN.kyushu,
        ],
      },
    },
    answer: { correct_ids: ["shikoku"] },
    explanation: {
      short: "四国は本州の南に位置する島で、香川・愛媛・徳島・高知の4県があります。",
    },
    curriculum_ref: { grade: 4, unit_number: 1, learning_point: "位置" },
    hint: "本州と九州のあいだにある小さな島だよ。",
    tags: ["地図", "都道府県"],
  },
  {
    id: "g4_u1_q005",
    unit_id: "g4_u1",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "「三日月のような形」で知られる都道府県はどれですか？",
      choices: [
        { id: "a", text: "千葉県" },
        { id: "b", text: "埼玉県" },
        { id: "c", text: "群馬県" },
        { id: "d", text: "栃木県" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "千葉県は房総半島が三日月のような形をしています。",
    },
    curriculum_ref: { grade: 4, unit_number: 1, learning_point: "形" },
    hint: "東京湾の東側にある、細長い半島の県だよ。",
    tags: ["都道府県"],
  },
  {
    id: "g4_u1_q006",
    unit_id: "g4_u1",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "「の」の字のような形の都道府県はどれですか？",
      choices: [
        { id: "a", text: "兵庫県" },
        { id: "b", text: "京都府" },
        { id: "c", text: "奈良県" },
        { id: "d", text: "和歌山県" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "兵庫県は神戸と姫路のあたりがくびれ、「の」の字のような形をしています。",
    },
    curriculum_ref: { grade: 4, unit_number: 1, learning_point: "形" },
    hint: "神戸港がある県だよ。",
    tags: ["都道府県"],
  },
  {
    id: "g4_u1_q007",
    unit_id: "g4_u1",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "埼玉県の県庁所在地はどこですか？",
      choices: [
        { id: "a", text: "さいたま市" },
        { id: "b", text: "川越市" },
        { id: "c", text: "所沢市" },
        { id: "d", text: "熊谷市" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "埼玉県の県庁所在地はさいたま市です。",
    },
    curriculum_ref: { grade: 4, unit_number: 1, learning_point: "県庁所在地" },
    hint: "浦和市と大宮市などが合併してできた市だよ。",
    tags: ["都道府県"],
  },
  {
    id: "g4_u1_q008",
    unit_id: "g4_u1",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "北海道の県庁所在地はどこですか？",
      choices: [
        { id: "a", text: "札幌市" },
        { id: "b", text: "函館市" },
        { id: "c", text: "旭川市" },
        { id: "d", text: "釧路市" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "北海道の県庁所在地は札幌市です。",
    },
    curriculum_ref: { grade: 4, unit_number: 1, learning_point: "県庁所在地" },
    hint: "北海道で一番大きな都市だよ。",
    tags: ["都道府県"],
  },
  {
    id: "g4_u2_q001",
    unit_id: "g4_u2",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "きれいな水を家庭に届ける仕事をしているのはどれですか？",
      choices: [
        { id: "a", text: "上水道の事業" },
        { id: "b", text: "農家" },
        { id: "c", text: "パン屋" },
        { id: "d", text: "銀行" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "上水道は、人々の健康や生活を支える大切な公共サービスです。",
    },
    curriculum_ref: { grade: 4, unit_number: 2, learning_point: "上水道" },
    hint: "蛇口から水が出るのは誰の働きかな？",
  },
  {
    id: "g4_u3_q001",
    unit_id: "g4_u3",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "台風の前にできる備えとして正しいものはどれですか？",
      choices: [
        { id: "a", text: "雨どいの掃除や飛ばされやすい物の片付け" },
        { id: "b", text: "川の近くで遊ぶ" },
        { id: "c", text: "窓を開けたまま外出する" },
        { id: "d", text: "避難場所を調べない" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "台風の前には、家の周りの安全確認や避難場所の確認が大切です。",
    },
    curriculum_ref: { grade: 4, unit_number: 3, learning_point: "台風への備え" },
    hint: "強い風で飛んでいきそうなものは？",
  },
  {
    id: "g4_u4_q001",
    unit_id: "g4_u4",
    type: "video_intro",
    difficulty: 2,
    question: {
      text: "紹介を見たあと、お祭りが伝統文化として大切な理由を選びましょう。",
      choices: [
        { id: "a", text: "地域の人々の願いや歴史が受け継がれているから" },
        { id: "b", text: "毎日同じ料理が食べられるから" },
        { id: "c", text: "学校の宿題がなくなるから" },
        { id: "d", text: "外国の法律が決まるから" },
      ],
      media: {
        kind: "history_animation",
        title: "年中行事と伝統文化",
        description: "地域の祭りがどのように受け継がれてきたかを見てみよう。",
        slides: [
          {
            era: "昔",
            period: "100年前",
            headline: "村の人々が集まる祭り",
            detail: "収穫を祝い、先祖に感謝する行事が行われました。",
          },
          {
            era: "今",
            period: "現在",
            headline: "受け継がれる年中行事",
            detail: "祭りは地域のつながりと文化を伝える大切な活動です。",
          },
        ],
      },
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "年中行事や文化財は、地域の人々の願いや歴史を伝える大切なものです。",
    },
    curriculum_ref: { grade: 4, unit_number: 4, learning_point: "伝統文化" },
    hint: "祭りは何を伝える行事だろう？",
    tags: ["動画", "文化"],
  },
  {
    id: "g4_u5_q001",
    unit_id: "g4_u5",
    type: "map_pin",
    difficulty: 2,
    question: {
      text: "地図で、伝統的な陶磁器の産地として有名な「瀬戸」がある地方をタップしよう。",
      choices: [],
      map: {
        map_id: "japan_regions",
        regions: [
          JAPAN_PIN.chubu,
          JAPAN_PIN.kinki,
          JAPAN_PIN.tohoku,
          JAPAN_PIN.kyushu,
        ],
      },
    },
    answer: { correct_ids: ["chubu"] },
    explanation: {
      short: "瀬戸焼など、伝統的な技術を生かした地場産業が盛んな地域があります。",
    },
    curriculum_ref: { grade: 4, unit_number: 5, learning_point: "地場産業" },
    hint: "愛知県あたりにある、やきものの町で有名な地域だよ。",
  },
];

export const g5Questions: Question[] = [
  {
    id: "g5_u1_q001",
    unit_id: "g5_u1",
    type: "map_pin",
    difficulty: 1,
    question: {
      text: "日本列島で、本州・四国・九州・沖縄などと並ぶ「最北の大きな島」をタップしよう。",
      choices: [],
      map: {
        map_id: "japan_islands",
        regions: [
          JAPAN_PIN.hokkaido,
          JAPAN_PIN.honshu,
          JAPAN_PIN.shikoku,
          JAPAN_PIN.kyushu,
        ],
      },
    },
    answer: { correct_ids: ["hokkaido"] },
    explanation: {
      short: "日本の国土は北海道、本州、四国、九州、沖縄などの島々からなっています。",
      source_note: "学習指導要領解説 第5章 第5学年 (1)",
    },
    curriculum_ref: { grade: 5, unit_number: 1, learning_point: "国土の構成" },
    hint: "一番北にある島だよ。",
    tags: ["地図", "国土"],
  },
  {
    id: "g5_u1_q002",
    unit_id: "g5_u1",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "我が国の気候について正しいものはどれですか？",
      choices: [
        { id: "a", text: "四季の変化があり、地域によって気候が異なる" },
        { id: "b", text: "全国どこも同じ気温" },
        { id: "c", text: "日本には季節がない" },
        { id: "d", text: "南と北で気候は同じ" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "日本は南北に長く、太平洋側と日本海側でも気候が異なります。",
    },
    curriculum_ref: { grade: 5, unit_number: 1, learning_point: "気候" },
    hint: "北海道と沖縄の気温を比べてみよう。",
  },
  {
    id: "g5_u2_q001",
    unit_id: "g5_u2",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "米作りに適した土地はどれですか？",
      choices: [
        { id: "a", text: "水をためて使える田んぼ" },
        { id: "b", text: "砂漠" },
        { id: "c", text: "深い海" },
        { id: "d", text: "火山の火口" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "米は田んぼで育てられ、日本の食料生産の大切な部分です。",
    },
    curriculum_ref: { grade: 5, unit_number: 2, learning_point: "稲作" },
    hint: "田植えをする場所を思い出そう。",
  },
  {
    id: "g5_u3_q001",
    unit_id: "g5_u3",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "工業生産の特徴として正しいものはどれですか？",
      choices: [
        { id: "a", text: "工場で機械を使い、同じ製品を効率よく作る" },
        { id: "b", text: "1つ1つ手作りだけで作る" },
        { id: "c", text: "工場では何も作らない" },
        { id: "d", text: "工業製品は使われない" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "工業は工場で機械や人の技術を使い、たくさんの製品を作ります。",
    },
    curriculum_ref: { grade: 5, unit_number: 3, learning_point: "工業生産" },
    hint: "自動車や家電はどこで作られる？",
  },
  {
    id: "g5_u4_q001",
    unit_id: "g5_u4",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "情報化が産業や生活にもたらした変化として正しいものはどれですか？",
      choices: [
        { id: "a", text: "インターネットで情報を素早く伝えられる" },
        { id: "b", text: "情報は一切使われなくなった" },
        { id: "c", text: "新聞や放送はなくなった" },
        { id: "d", text: "電話は使えなくなった" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "情報通信技術は、産業の発展や国民生活の向上に大きく関わっています。",
    },
    curriculum_ref: { grade: 5, unit_number: 4, learning_point: "情報化" },
    hint: "スマートフォンやパソコンで何ができる？",
  },
  {
    id: "g5_u5_q001",
    unit_id: "g5_u5",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "森林が国土の環境にもたらす役割として正しいものはどれですか？",
      choices: [
        { id: "a", text: "土砂を守り、水を蓄えるなど環境を守る" },
        { id: "b", text: "必ず地震を起こす" },
        { id: "c", text: "雨をふらせなくする" },
        { id: "d", text: "土地を汚す" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "森林は国土の環境保全に重要な役割を果たしています。",
    },
    curriculum_ref: { grade: 5, unit_number: 5, learning_point: "森林" },
    hint: "山に木がたくさんあるとどんな良いことが？",
  },
];

export const g6Questions: Question[] = [
  {
    id: "g6_u1_q001",
    unit_id: "g6_u1",
    type: "multiple_choice",
    difficulty: 1,
    question: {
      text: "国の政治を行う機関として正しい組み合わせはどれですか？",
      choices: [
        { id: "a", text: "国会・内閣・裁判所" },
        { id: "b", text: "市役所・学校・病院" },
        { id: "c", text: "銀行・工場・農家" },
        { id: "d", text: "消防署・郵便局・図書館" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "国会は法律を作り、内閣は行政を行い、裁判所は法律に基づいて裁判をします。",
      source_note: "学習指導要領解説 第6章 第6学年 (1)",
    },
    curriculum_ref: { grade: 6, unit_number: 1, learning_point: "三権分立" },
    hint: "三つの柱を思い出そう。",
  },
  {
    id: "g6_u1_q002",
    unit_id: "g6_u1",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "地方自治の意味として正しいものはどれですか？",
      choices: [
        { id: "a", text: "その地域の住民が自治を行うこと" },
        { id: "b", text: "外国の政府が日本を治めること" },
        { id: "c", text: "学校だけが政治を行うこと" },
        { id: "d", text: "市長だけが決めること" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "地方自治は、住民が選んだ代表者などを通じて、その地域の政治を行う仕組みです。",
    },
    curriculum_ref: { grade: 6, unit_number: 1, learning_point: "地方自治" },
    hint: "市や県のくらしは誰が決める？",
  },
  {
    id: "g6_u2_q001",
    unit_id: "g6_u2",
    type: "video_intro",
    difficulty: 1,
    question: {
      text: "歴史の紹介を見たあと、聖徳太子（しょうとくたいし）が行ったこととして正しいものを選びましょう。",
      choices: [
        { id: "a", text: "冠位十二階の制定や遣隋使の派遣" },
        { id: "b", text: "鎌倉幕府の成立" },
        { id: "c", text: "明治維新" },
        { id: "d", text: "大化の改新" },
      ],
      media: {
        kind: "history_animation",
        title: "飛鳥時代の日本",
        description: "遣隋使や冠位十二階など、飛鳥時代の出来事を見てみよう。",
        slides: [
          {
            era: "飛鳥",
            period: "6〜7世紀",
            headline: "遣隋使の派遣",
            detail: "中国（隋）に使いを送り、文化や制度を学びました。",
          },
          {
            era: "飛鳥",
            period: "603年",
            headline: "冠位十二階の制定",
            detail: "能力や功績に応じて役割を与える制度を整えました。",
          },
        ],
      },
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "聖徳太子は冠位十二階を定め、遣隋使を派遣するなど、国家の基盤を整えました。",
    },
    curriculum_ref: { grade: 6, unit_number: 2, learning_point: "飛鳥時代" },
    hint: "紹介で出てきた制度の名前を思い出そう。",
    tags: ["歴史", "動画"],
  },
  {
    id: "g6_u2_q002",
    unit_id: "g6_u2",
    type: "sort_order",
    difficulty: 2,
    question: {
      text: "次の出来事を古い順に並べ替えよう。",
      choices: [],
      sort_items: [
        { id: "e1", text: "大化の改新" },
        { id: "e2", text: "鎌倉幕府の成立" },
        { id: "e3", text: "明治維新" },
      ],
    },
    answer: { correct_ids: ["e1", "e2", "e3"] },
    explanation: {
      short: "大化の改新（645年）→ 鎌倉幕府（1185年）→ 明治維新（1868年）の順です。",
      detail: "年表を使うと、歴史の流れを整理できます。",
    },
    curriculum_ref: { grade: 6, unit_number: 2, learning_point: "時代区分" },
    hint: "一番古いのは奈良時代より前の出来事だよ。",
    tags: ["年表", "並べ替え"],
  },
  {
    id: "g6_u2_q003",
    unit_id: "g6_u2",
    type: "video_intro",
    difficulty: 3,
    question: {
      text: "江戸時代の紹介を見たあと、当時のくらしについて正しいものを選びましょう。",
      choices: [
        { id: "a", text: "幕府が政治の中心で、町人文化も花開いた" },
        { id: "b", text: "コンピュータが普及していた" },
        { id: "c", text: "自動車で移動していた" },
        { id: "d", text: "外国と交流が完全になかった" },
      ],
      media: {
        kind: "history_animation",
        title: "江戸時代のくらし",
        slides: [
          {
            era: "江戸",
            period: "1603〜1868年",
            headline: "幕府による政治",
            detail: "江戸幕府が全国を治め、長い平和な時代が続きました。",
          },
          {
            era: "江戸",
            period: "17〜19世紀",
            headline: "町人文化の発展",
            detail: "浮世絵や歌舞伎など、町人の文化が栄えました。",
          },
        ],
      },
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "江戸時代は幕府が政治の中心で、農業や町人文化など独自の発展を遂げました。",
    },
    curriculum_ref: { grade: 6, unit_number: 2, learning_point: "江戸時代" },
    hint: "浮世絵や歌舞伎が盛んだった時代だよ。",
  },
  {
    id: "g6_u3_q001",
    unit_id: "g6_u3",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "グローバル化の進展について正しいものはどれですか？",
      choices: [
        { id: "a", text: "国と国の人々の交流や経済のつながりが深まっている" },
        { id: "b", text: "国と国の交流はなくなった" },
        { id: "c", text: "日本だけが世界から切り離された" },
        { id: "d", text: "外国の文化は一切入ってこない" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "グローバル化により、人・物・情報の国際的な交流が活発になっています。",
    },
    curriculum_ref: { grade: 6, unit_number: 3, learning_point: "グローバル化" },
    hint: "外国の食べ物や商品が店にあるのはなぜ？",
  },
  {
    id: "g6_u3_q002",
    unit_id: "g6_u3",
    type: "multiple_choice",
    difficulty: 2,
    question: {
      text: "国際社会で日本が果たす役割の例として正しいものはどれですか？",
      choices: [
        { id: "a", text: "国際協力や平和維持への取り組み" },
        { id: "b", text: "他国の内政に干渉すること" },
        { id: "c", text: "交流を避けること" },
        { id: "d", text: "条約を守らないこと" },
      ],
    },
    answer: { correct_ids: ["a"] },
    explanation: {
      short: "日本は国際協力や平和維持など、世界と共に生きるための役割を担っています。",
    },
    curriculum_ref: { grade: 6, unit_number: 3, learning_point: "国際協力" },
    hint: "平和を守るために国際的に協力することがあるよ。",
  },
];
