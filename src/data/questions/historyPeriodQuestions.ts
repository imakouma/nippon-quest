import type { Question } from "@/types/question";
import type { HistoryModeId } from "@/data/historyModes";
import { HISTORY_QUIZ_UNITS } from "@/data/historyModes";

function mcQuestion(
  modeId: HistoryModeId,
  index: number,
  opts: {
    text: string;
    choices: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    explanation: string;
    hint: string;
    difficulty?: 1 | 2 | 3;
    learningPoint: string;
    tags?: string[];
  },
): Question {
  const ids = ["a", "b", "c", "d"] as const;
  return {
    id: `${modeId}_extra_q${String(index + 1).padStart(3, "0")}`,
    unit_id: modeId,
    type: "multiple_choice",
    difficulty: opts.difficulty ?? 2,
    question: {
      text: opts.text,
      choices: opts.choices.map((text, i) => ({ id: ids[i], text })),
    },
    answer: { correct_ids: [ids[opts.correctIndex]] },
    explanation: { short: opts.explanation },
    curriculum_ref: {
      grade: 6,
      unit_number: 2,
      learning_point: opts.learningPoint,
    },
    hint: opts.hint,
    tags: opts.tags ?? ["歴史"],
  };
}

type PeriodBuilder = (modeId: HistoryModeId) => Question[];

const PERIOD_BUILDERS: Partial<Record<HistoryModeId, PeriodBuilder>> = {
  "history-jomon": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "縄文時代の人々のくらしとして、正しいものはどれですか？",
      choices: [
        "狩りや採集をしながら、土器を使ってくらしていた",
        "稲を育てて米を主食にしていた",
        "鉄の刀で戦っていた",
        "自動車で移動していた",
      ],
      correctIndex: 0,
      explanation:
        "縄文時代の人々は、狩りや採集を中心にくらし、縄目の模様がある土器を使っていました。",
      hint: "「縄文」の名前のとおり、土器が特徴的な時代だよ。",
      difficulty: 1,
      learningPoint: "縄文時代",
      tags: ["縄文時代"],
    }),
    mcQuestion(modeId, 1, {
      text: "縄文土器の特徴として、正しいものはどれですか？",
      choices: [
        "縄目のような模様がついている",
        "金属でできている",
        "透明で割れやすい",
        "電気で温められる",
      ],
      correctIndex: 0,
      explanation:
        "縄文土器は、縄を巻きつけた模様がついた土の器で、縄文時代の代表的な道具です。",
      hint: "時代の名前にもなっている模様だよ。",
      difficulty: 1,
      learningPoint: "縄文時代",
      tags: ["縄文時代", "縄文土器"],
    }),
    mcQuestion(modeId, 2, {
      text: "縄文時代に作られた、人や動物の形をした土の像を何といいますか？",
      choices: ["土偶", "古墳", "天守閣", "仏像"],
      correctIndex: 0,
      explanation:
        "土偶は、縄文時代に作られた人や動物の形をした土の像で、縄文時代の文化を知る大切な資料です。",
      hint: "「土」でできた「像」の名前だよ。",
      difficulty: 1,
      learningPoint: "縄文時代",
      tags: ["縄文時代", "土偶"],
    }),
    mcQuestion(modeId, 3, {
      text: "縄文時代の遺跡で、食べた貝の殻が積み重なってできたものを何といいますか？",
      choices: ["貝塚", "古墳", "環壕集落", "城下町"],
      correctIndex: 0,
      explanation:
        "貝塚は、縄文時代の人々が食べた貝の殻などが長い年月をかけて積み重なってできた遺跡です。",
      hint: "「貝」と「塚」という言葉が入った名前だよ。",
      difficulty: 1,
      learningPoint: "縄文時代",
      tags: ["縄文時代", "貝塚"],
    }),
    mcQuestion(modeId, 4, {
      text: "縄文時代の住まいとして、地面を掘り下げて作った住居を何といいますか？",
      choices: ["たて穴住居", "マンション", "天守閣", "平城京"],
      correctIndex: 0,
      explanation:
        "たて穴住居は、地面を少し掘り下げて柱を立て、屋根をかぶせて作った縄文時代の住まいです。",
      hint: "地面に「穴」を掘って作った住まいだよ。",
      difficulty: 1,
      learningPoint: "縄文時代",
      tags: ["縄文時代", "たて穴住居"],
    }),
  ],

  "history-yayoi": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "弥生時代に日本でも広まった、新しい農業の仕方はどれですか？",
      choices: ["稲作", "小麦だけの栽培", "果物の狩り", "魚の飼育"],
      correctIndex: 0,
      explanation:
        "弥生時代には稲作が伝わり、米を育てるくらしが日本各地に広がりました。",
      hint: "田んぼで育てる穀物の名前だよ。",
      difficulty: 1,
      learningPoint: "弥生時代",
      tags: ["弥生時代", "稲作"],
    }),
    mcQuestion(modeId, 1, {
      text: "弥生時代のくらしの変化として、正しいものはどれですか？",
      choices: [
        "稲作や金属器が使われるようになった",
        "土器だけでくらしていた",
        "自動車が普及した",
        "インターネットが使われた",
      ],
      correctIndex: 0,
      explanation:
        "弥生時代には稲作が始まり、金属の道具も使われるようになり、くらしが大きく変わりました。",
      hint: "縄文時代とのちがいを考えてみよう。",
      difficulty: 1,
      learningPoint: "弥生時代",
      tags: ["弥生時代"],
    }),
    mcQuestion(modeId, 2, {
      text: "弥生時代に、中国や朝鮮半島などの大陸から日本へ伝わった農業はどれですか？",
      choices: ["稲作（米づくり）", "トウモロコシの栽培", "パンの製造", "魚の養殖だけ"],
      correctIndex: 0,
      explanation:
        "弥生時代の始めごろ、大陸からの人々や物の交流を通じて稲作（米づくり）が日本に伝わり、各地に広がりました。",
      hint: "田んぼで育てる穀物のことだよ。",
      difficulty: 1,
      learningPoint: "弥生時代",
      tags: ["弥生時代", "稲作", "米づくり"],
    }),
    mcQuestion(modeId, 3, {
      text: "弥生時代後期に、邪馬台国（やまたいこく）の女王として知られる人物は誰ですか？",
      choices: ["卑弥呼（ひみこ）", "聖徳太子", "源頼朝", "織田信長"],
      correctIndex: 0,
      explanation:
        "卑弥呼は、中国の歴史書『魏志倭人伝（ぎしわじんでん）』に記された邪馬台国の女王です。",
      hint: "『魏志倭人伝』に名前が出てくる女王だよ。",
      difficulty: 1,
      learningPoint: "弥生時代",
      tags: ["弥生時代", "卑弥呼", "邪馬台国"],
    }),
    mcQuestion(modeId, 4, {
      text: "吉野ヶ里遺跡について、正しいものはどれですか？",
      choices: [
        "弥生時代の環壕集落の遺跡で、佐賀県にある",
        "江戸時代の城の跡",
        "縄文時代の貝塚",
        "明治時代の工場跡",
      ],
      correctIndex: 0,
      explanation:
        "吉野ヶ里遺跡は、佐賀県にあり、弥生時代の環壕集落（堀で囲まれた集落）の様子がよくわかる遺跡です。",
      hint: "九州・佐賀県にある、弥生時代の集落の遺跡だよ。",
      difficulty: 1,
      learningPoint: "弥生時代",
      tags: ["弥生時代", "吉野ヶ里遺跡", "環壕集落"],
    }),
  ],

  "history-kofun": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "古墳時代に各地に作られた、大きな墓のことを何といいますか？",
      choices: ["古墳", "天守閣", "神社", "城下町"],
      correctIndex: 0,
      explanation:
        "古墳時代には、有力者の墓として大きな古墳が各地に作られました。",
      hint: "時代の名前にもなっている、大きな墓だよ。",
      difficulty: 1,
      learningPoint: "古墳時代",
      tags: ["古墳時代"],
    }),
    mcQuestion(modeId, 1, {
      text: "日本で最大の前方後円墳として知られる、大阪にある古墳はどれですか？",
      choices: ["大仙古墳", "稲荷山古墳", "前方後円墳公園", "平城京"],
      correctIndex: 0,
      explanation:
        "大仙古墳は大阪府堺市にある日本最大の古墳で、古墳時代の有力者の墓として知られています。",
      hint: "堺市にある、とても大きな鍵穴形の古墳だよ。",
      difficulty: 1,
      learningPoint: "古墳時代",
      tags: ["古墳時代", "大仙古墳"],
    }),
    mcQuestion(modeId, 2, {
      text: "古墳時代に畿内（やまと）を中心として発展した、日本の政治の中心となっていた政権を何といいますか？",
      choices: ["大和朝廷", "鎌倉幕府", "江戸幕府", "室町幕府"],
      correctIndex: 0,
      explanation:
        "大和朝廷は畿内を中心とした政権で、古墳時代の日本の政治の中心となりました。",
      hint: "「大和」という地名が入った、朝廷の名前だよ。",
      difficulty: 1,
      learningPoint: "古墳時代",
      tags: ["古墳時代", "大和朝廷"],
    }),
    mcQuestion(modeId, 3, {
      text: "朝鮮半島や中国などから来日し、鉄器づくりや織物などの技術を伝えた人々を何といいますか？",
      choices: ["渡来人", "武士", "町人", "大名"],
      correctIndex: 0,
      explanation:
        "渡来人は大陸から来日した人々で、農業や手工業の技術などを日本に伝えました。",
      hint: "海を「渡って」来た人という意味が名前に入っているよ。",
      difficulty: 1,
      learningPoint: "古墳時代",
      tags: ["古墳時代", "渡来人"],
    }),
    mcQuestion(modeId, 4, {
      text: "日本最古の歴史書として、神話や古代の出来事が記されているものはどれですか？",
      choices: ["古事記", "源氏物語", "万葉集", "徒然草"],
      correctIndex: 0,
      explanation:
        "古事記は日本最古の歴史書で、日本のはじまりや古代の出来事が記されています。",
      hint: "「古い」「ことを」「記した」という意味の名前だよ。",
      difficulty: 1,
      learningPoint: "古墳時代",
      tags: ["古墳時代", "古事記"],
    }),
    mcQuestion(modeId, 5, {
      text: "冠位十二階を定め、遣隋使を派遣したことでも知られる人物は誰ですか？",
      choices: ["聖徳太子", "源頼朝", "織田信長", "徳川家康"],
      correctIndex: 0,
      explanation:
        "聖徳太子は飛鳥時代の政治家で、冠位十二階の制定や遣隋使の派遣など、国家の基盤を整えました。",
      hint: "飛鳥時代の紹介動画でも出てきた人物だよ。",
      difficulty: 1,
      learningPoint: "古墳時代",
      tags: ["古墳時代", "聖徳太子"],
    }),
  ],

  "history-asuka": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "645年に行われ、天皇中心の国づくりを進めた改革はどれですか？",
      choices: ["大化の改新", "明治維新", "廃藩置県", "冠位十二階"],
      correctIndex: 0,
      explanation:
        "大化の改新は飛鳥時代の改革で、天皇を中心とした政治を進めました。",
      hint: "聖徳太子のあと、中大兄皇子らが行った改革だよ。",
      learningPoint: "飛鳥時代",
      tags: ["飛鳥時代", "大化の改新"],
    }),
    mcQuestion(modeId, 1, {
      text: "大化の改新を進めるときに中大兄皇子とともに活躍し、のちに藤原氏の祖となった人物は誰ですか？",
      choices: ["中臣鎌足", "聖徳太子", "源頼朝", "蘇我入鹿"],
      correctIndex: 0,
      explanation:
        "中臣鎌足は大化の改新を支えた政治家で、のちに藤原姓を賜り藤原氏の祖となりました。",
      hint: "「中臣」という姓を持っていた、改革の中心人物だよ。",
      difficulty: 2,
      learningPoint: "飛鳥時代",
      tags: ["飛鳥時代", "中臣鎌足", "大化の改新"],
    }),
    mcQuestion(modeId, 2, {
      text: "645年の大化の改新を進めた皇子で、のちに天智天皇となった人物は誰ですか？",
      choices: [
        "中大兄皇子（天智天皇）",
        "聖徳太子",
        "厩戸皇子",
        "後白河天皇",
      ],
      correctIndex: 0,
      explanation:
        "中大兄皇子は大化の改新を主導し、のちに天智天皇として政治を行いました。",
      hint: "「皇子」という言葉が入った、若いころの呼び名だよ。",
      difficulty: 2,
      learningPoint: "飛鳥時代",
      tags: ["飛鳥時代", "中大兄皇子", "大化の改新"],
    }),
    mcQuestion(modeId, 3, {
      text: "飛鳥時代に強い力を持ち、政治に大きな影響を与えていた豪族はどれですか？",
      choices: ["蘇我氏", "源氏", "足利氏", "徳川氏"],
      correctIndex: 0,
      explanation:
        "蘇我氏は飛鳥時代の有力な豪族で、政治に大きな力を持っていました。",
      hint: "「蘇我」という名字の、古代の豪族だよ。",
      difficulty: 1,
      learningPoint: "飛鳥時代",
      tags: ["飛鳥時代", "蘇我氏"],
    }),
    mcQuestion(modeId, 4, {
      text: "古代の律令制のもとで、農民が納めた税金や労役のことをまとめて何といいますか？",
      choices: ["租庸調（そようちょう）", "刀狩", "廃藩置県", "大政官"],
      correctIndex: 0,
      explanation:
        "租庸調は、律令国家で農民が納める租・庸・調という税金や労役のことです。",
      hint: "「租」「庸」「調」の三つの言葉を並べた名前だよ。",
      difficulty: 2,
      learningPoint: "飛鳥時代",
      tags: ["飛鳥時代", "租庸調", "律令"],
    }),
    mcQuestion(modeId, 5, {
      text: "古代の日本で、法律（律）と政令（令）にもとづいて国を治める制度を何といいますか？",
      choices: ["律令制", "幕府制", "封建制", "立憲制"],
      correctIndex: 0,
      explanation:
        "律令制は、律令にもとづいて政治を行う古代日本の国家の仕組みです。",
      hint: "「律」と「令」という言葉が入った制度の名前だよ。",
      difficulty: 2,
      learningPoint: "飛鳥時代",
      tags: ["飛鳥時代", "律令"],
    }),
  ],

  "history-nara": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "奈良時代に都が置かれた場所はどれですか？",
      choices: ["平城京（なら）", "平安京（きょうと）", "江戸（とうきょう）", "鎌倉"],
      correctIndex: 0,
      explanation:
        "奈良時代には平城京（現在の奈良市付近）が都となり、律令国家が整えられました。",
      hint: "大仏で有名な都だよ。",
      difficulty: 1,
      learningPoint: "奈良時代",
      tags: ["奈良時代", "平城京"],
    }),
    mcQuestion(modeId, 1, {
      text: "東大寺の大仏を建立し、全国に国分寺・国分尼寺を建てさせた奈良時代の天皇は誰ですか？",
      choices: ["聖武天皇", "天武天皇", "後白河天皇", "明治天皇"],
      correctIndex: 0,
      explanation:
        "聖武天皇は仏教の力で国を守ろうとし、東大寺の大仏や全国の国分寺づくりを進めました。",
      hint: "「武」という字が入った、奈良時代の天皇だよ。",
      difficulty: 2,
      learningPoint: "奈良時代",
      tags: ["奈良時代", "聖武天皇", "東大寺", "国分寺"],
    }),
    mcQuestion(modeId, 2, {
      text: "奈良時代、聖武天皇が奈良に建てさせた、大仏で有名なお寺はどれですか？",
      choices: ["東大寺", "金閣寺", "法隆寺", "清水寺"],
      correctIndex: 0,
      explanation:
        "東大寺は奈良の大仏で知られるお寺で、聖武天皇の時代に建立が進められました。",
      hint: "奈良の大仏があるお寺だよ。",
      difficulty: 1,
      learningPoint: "奈良時代",
      tags: ["奈良時代", "東大寺", "聖武天皇"],
    }),
    mcQuestion(modeId, 3, {
      text: "奈良時代、聖武天皇の命令で全国の国ごとに建てられたお寺を何といいますか？",
      choices: ["国分寺", "苔寺", "東大寺", "法隆寺"],
      correctIndex: 0,
      explanation:
        "国分寺は律令国ごとに建てられた官寺で、国の安泰と仏教の守りを願って全国に建てられました。",
      hint: "「国」を分けて建てた、という意味が名前に入っているよ。",
      difficulty: 2,
      learningPoint: "奈良時代",
      tags: ["奈良時代", "国分寺", "聖武天皇"],
    }),
    mcQuestion(modeId, 4, {
      text: "奈良時代などに、中国の唐へ学びや交流のために送られた使節を何といいますか？",
      choices: ["遣唐使", "遣隋使", "黒船", "関白"],
      correctIndex: 0,
      explanation:
        "遣唐使は唐への使節で、政治や文化の学びのために何度も派遣されました。",
      hint: "「唐」という国の名前が入った使節の呼び名だよ。",
      difficulty: 2,
      learningPoint: "奈良時代",
      tags: ["奈良時代", "遣唐使"],
    }),
    mcQuestion(modeId, 5, {
      text: "何度も航海に失敗しながらも日本に渡り、仏教の戒律を伝えた唐の僧は誰ですか？",
      choices: ["鑑真", "空海", "最澄", "聖徳太子"],
      correctIndex: 0,
      explanation:
        "鑑真は唐の高僧で、753年に日本へ渡り、東大寺戒壇院などで仏教の戒律を伝えました。",
      hint: "目が見えなくなるまで日本への渡航を続けた僧だよ。",
      difficulty: 2,
      learningPoint: "奈良時代",
      tags: ["奈良時代", "鑑真"],
    }),
  ],

  "history-heian": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "平安時代の貴族のくらしを表す文学作品として有名なものはどれですか？",
      choices: ["源氏物語", "徒然草", "万葉集", "古事記"],
      correctIndex: 0,
      explanation:
        "源氏物語は紫式部によって書かれた物語で、平安貴族の生活を知る手がかりになります。",
      hint: "紫式部が書いた、長い物語の名前だよ。",
      difficulty: 1,
      learningPoint: "平安時代",
      tags: ["平安時代", "国風文化", "源氏物語"],
    }),
    mcQuestion(modeId, 1, {
      text: "794年に桓武天皇が都を移し、平安時代が始まった都はどれですか？",
      choices: ["平安京（きょうと）", "平城京（なら）", "江戸（とうきょう）", "鎌倉"],
      correctIndex: 0,
      explanation:
        "794年に都は平安京へ移され、これをきっかけに平安時代が始まりました。",
      hint: "現在の京都にあたる都の名前だよ。",
      difficulty: 1,
      learningPoint: "平安時代",
      tags: ["平安時代", "794年", "平安京"],
    }),
    mcQuestion(modeId, 2, {
      text: "平安時代の貴族の住まいの様式を何といいますか？",
      choices: ["寝殿造（しんでんづくり）", "書院造", "城郭", "長屋"],
      correctIndex: 0,
      explanation:
        "寝殿造は平安時代の貴族の邸宅の建築様式で、正殿を中心に建物が配置されました。",
      hint: "「寝殿」という言葉が入った、貴族の家の様式だよ。",
      difficulty: 2,
      learningPoint: "平安時代",
      tags: ["平安時代", "寝殿造"],
    }),
    mcQuestion(modeId, 3, {
      text: "「この世をば我が世とぞ思ふ」の歌で知られる、平安時代の有力な貴族は誰ですか？",
      choices: ["藤原道長", "藤原鎌足", "源頼朝", "織田信長"],
      correctIndex: 0,
      explanation:
        "藤原道長は平安時代の摂関政治を代表する貴族で、権勢のピークを迎えた人物です。",
      hint: "藤原という姓の、道長という名前の貴族だよ。",
      difficulty: 2,
      learningPoint: "平安時代",
      tags: ["平安時代", "藤原道長"],
    }),
    mcQuestion(modeId, 4, {
      text: "ひらがなや日本独自の文化が花開いた平安時代の文化を何といいますか？",
      choices: ["国風文化（こくふうぶんか）", "律令文化", "洋風文化", "軍事文化"],
      correctIndex: 0,
      explanation:
        "国風文化は、中国の影響を受けつつも日本独自に発展した平安時代の文化のことです。",
      hint: "「国の風」という意味が名前に入った文化だよ。",
      difficulty: 2,
      learningPoint: "平安時代",
      tags: ["平安時代", "国風文化"],
    }),
    mcQuestion(modeId, 5, {
      text: "『枕草子』を書いた平安時代の女房は誰ですか？",
      choices: ["清少納言", "紫式部", "和泉式部", "小野小町"],
      correctIndex: 0,
      explanation:
        "清少納言は平安時代の女房で、随筆『枕草子』の作者として知られています。",
      hint: "「清」という字が入った、女房の名前だよ。",
      difficulty: 2,
      learningPoint: "平安時代",
      tags: ["平安時代", "清少納言", "国風文化"],
    }),
  ],

  "history-kamakura": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "1185年に源頼朝が開いた、武士の政治の中心はどれですか？",
      choices: ["鎌倉幕府", "江戸幕府", "大阪幕府", "京都幕府"],
      correctIndex: 0,
      explanation:
        "鎌倉幕府は源頼朝によって開かれ、武士が政治の中心となる時代が始まりました。",
      hint: "関東の町の名前がついた幕府だよ。",
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "幕府", "源頼朝"],
    }),
    mcQuestion(modeId, 1, {
      text: "鎌倉時代に武士の間で重んじられた考え方として正しいものはどれですか？",
      choices: [
        "主君に忠義を尽くすこと",
        "貴族の歌を詠むこと",
        "外国への使節を送ること",
        "稲作だけを行うこと",
      ],
      correctIndex: 0,
      explanation:
        "鎌倉時代には武士が政治の中心となり、忠義などの武士道の精神が重んじられました。",
      hint: "武士は誰に仕える人だったかな？",
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "武士"],
    }),
    mcQuestion(modeId, 2, {
      text: "1159年に平氏と源氏が争い、のちに平氏が力を伸ばすきっかけとなった乱はどれですか？",
      choices: ["平治の乱", "応仁の乱", "承久の乱", "大化の改新"],
      correctIndex: 0,
      explanation:
        "平治の乱は平氏と源氏の争いで、平氏が勝利し、その後平氏政権が築かれました。",
      hint: "「平」と「治」という字が入った乱の名前だよ。",
      difficulty: 2,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "平治の乱", "平清盛"],
    }),
    mcQuestion(modeId, 3, {
      text: "平治の乱のあと勢力を伸ばし、平氏政権を築いた武将は誰ですか？",
      choices: ["平清盛", "源頼朝", "足利尊氏", "織田信長"],
      correctIndex: 0,
      explanation:
        "平清盛は平氏の棟梁として権勢を伸ばし、武士が初めて朝廷の実権を握りました。",
      hint: "「平」という姓の、清盛という名前の武将だよ。",
      difficulty: 2,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "平清盛", "平治の乱"],
    }),
    mcQuestion(modeId, 4, {
      text: "平氏が深く崇敬し、海上の鳥居で有名な神社はどれですか？",
      choices: [
        "厳島神社（いつくしまじんじゃ）",
        "伊勢神宮",
        "伏見稲荷大社",
        "明治神宮",
      ],
      correctIndex: 0,
      explanation:
        "厳島神社は広島の宮島にある神社で、平氏が信仰を深め、海上の鳥居で知られています。",
      hint: "宮島にある、海に建つ鳥居の神社だよ。",
      difficulty: 2,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "厳島神社", "平清盛"],
    }),
    mcQuestion(modeId, 5, {
      text: "鎌倉幕府が全国の国に置いて、治安や軍事を任せた武士の職はどれですか？",
      choices: ["守護（しゅご）", "関白", "遣唐使", "国司"],
      correctIndex: 0,
      explanation:
        "守護は鎌倉幕府が各国に配置した武士で、治安維持や軍事などを担当しました。",
      hint: "国を「守る」という意味が名前に入っているよ。",
      difficulty: 2,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "守護", "幕府"],
    }),
    mcQuestion(modeId, 6, {
      text: "鎌倉幕府を開き、武士の棟梁として征夷大将軍となった人物は誰ですか？",
      choices: ["源頼朝", "平清盛", "足利義満", "徳川家康"],
      correctIndex: 0,
      explanation:
        "源頼朝は1192年に征夷大将軍となり、武士による本格的な政治が始まりました。",
      hint: "源氏の、鎌倉幕府を開いた武将だよ。",
      difficulty: 1,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "征夷大将軍", "源頼朝"],
    }),
    mcQuestion(modeId, 7, {
      text: "1185年に源氏と平氏が海上で戦い、平氏が滅びた戦いはどれですか？",
      choices: ["壇ノ浦の戦い", "関ヶ原の戦い", "桶狭間の戦い", "白河の戦い"],
      correctIndex: 0,
      explanation:
        "壇ノ浦の戦いで平氏は滅び、源氏の勝利により鎌倉時代が始まりました。",
      hint: "関門海峡近くの「壇ノ浦」で行われた海戦だよ。",
      difficulty: 2,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "壇ノ浦の戦い"],
    }),
    mcQuestion(modeId, 8, {
      text: "鎌倉幕府の北条泰時が制定した、武士社会の法（おきて）はどれですか？",
      choices: ["御成敗式目", "十七条の憲法", "日本国憲法", "廃藩置県"],
      correctIndex: 0,
      explanation:
        "御成敗式目は1232年に北条泰時が定めた、鎌倉幕府の基本的な法です。",
      hint: "「成敗」という言葉が入った、幕府のおきてだよ。",
      difficulty: 2,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "御成敗式目"],
    }),
    mcQuestion(modeId, 9, {
      text: "1221年に後鳥羽上皇が幕府に反抗した、鎌倉時代の乱はどれですか？",
      choices: ["承久の乱", "平治の乱", "応仁の乱", "播磨灘の戦い"],
      correctIndex: 0,
      explanation:
        "承久の乱は朝廷と幕府の争いで、幕府が勝利し武士の政治がさらに強まりました。",
      hint: "「承久」という年号の名がついた乱だよ。",
      difficulty: 2,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "承久の乱"],
    }),
    mcQuestion(modeId, 10, {
      text: "1274年と1281年に日本を攻めてきた外国の軍はどれですか？",
      choices: ["モンゴル（元）", "アメリカ", "清", "隋"],
      correctIndex: 0,
      explanation:
        "元寇はモンゴル帝国（元）による日本への出兵で、鎌倉時代の大きな出来事です。",
      hint: "中国大陸から攻めてきた、モンゴルの軍だよ。",
      difficulty: 2,
      learningPoint: "鎌倉時代",
      tags: ["鎌倉時代", "元寇"],
    }),
  ],

  "history-muromachi": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "室町時代に足利尊氏が開いた政治の中心はどれですか？",
      choices: ["室町幕府", "鎌倉幕府", "江戸幕府", "大阪幕府"],
      correctIndex: 0,
      explanation:
        "室町幕府は足利尊氏によって京都に開かれ、室町時代の政治の中心となりました。",
      hint: "京都にある、足利氏の幕府だよ。",
      learningPoint: "室町時代",
      tags: ["室町時代"],
    }),
  ],

  "history-sengoku": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "戦国時代の特徴として、最も適切なものはどれですか？",
      choices: [
        "各地の大名が領地を広げようと争った",
        "全国が完全に平和だった",
        "外国との交流がなかった",
        "天皇だけが政治を行った",
      ],
      correctIndex: 0,
      explanation:
        "戦国時代には各地の大名が力を競い合い、天下統一を目指して争いました。",
      hint: "織田信長や豊臣秀吉が活躍した時代だよ。",
      learningPoint: "戦国時代",
      tags: ["戦国時代"],
    }),
  ],

  "history-azuchi-momoyama": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "安土桃山時代に天下統一を進め、本能寺の変で倒れた武将は誰ですか？",
      choices: ["織田信長", "源頼朝", "聖徳太子", "徳川家康"],
      correctIndex: 0,
      explanation:
        "織田信長は戦国時代の武将で、天下統一を進めましたが本能寺の変で倒れました。",
      hint: "「天下布武」の旗印で知られる武将だよ。",
      learningPoint: "安土桃山時代",
      tags: ["安土桃山時代", "織田信長"],
    }),
    mcQuestion(modeId, 1, {
      text: "豊臣秀吉が行った、農民から武器を取り上げる政策はどれですか？",
      choices: ["刀狩", "廃藩置県", "大化の改新", "冠位十二階"],
      correctIndex: 0,
      explanation:
        "刀狩は豊臣秀吉が行った政策で、農民が武器を持たないようにしました。",
      hint: "「刀」を「狩る」という名前の政策だよ。",
      learningPoint: "安土桃山時代",
      tags: ["安土桃山時代", "豊臣秀吉"],
    }),
  ],

  "history-edo": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "1603年に江戸幕府を開いた武将は誰ですか？",
      choices: ["徳川家康", "織田信長", "豊臣秀吉", "源頼朝"],
      correctIndex: 0,
      explanation:
        "徳川家康は関ヶ原の戦いのあと、江戸幕府を開き、長い平和の時代をもたらしました。",
      hint: "関ヶ原の戦いに勝った武将だよ。",
      difficulty: 1,
      learningPoint: "江戸時代",
      tags: ["江戸時代", "徳川家康"],
    }),
    mcQuestion(modeId, 1, {
      text: "江戸時代に町人の間で栄えた文化として正しいものはどれですか？",
      choices: ["浮世絵や歌舞伎", "源氏物語の執筆", "古墳づくり", "遣隋使の派遣"],
      correctIndex: 0,
      explanation:
        "江戸時代には浮世絵や歌舞伎など、町人文化が大いに発展しました。",
      hint: "劇場で見る芸能や、色鮮やかな絵の名前だよ。",
      learningPoint: "江戸時代",
      tags: ["江戸時代", "文化"],
    }),
  ],

  "history-meiji": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "1868年の明治維新によって大きく変わったこととして正しいものはどれですか？",
      choices: [
        "天皇を中心とした近代国家づくりが進んだ",
        "江戸幕府が再び開かれた",
        "鎖国がさらに強まった",
        "武士だけが政治を行うようになった",
      ],
      correctIndex: 0,
      explanation:
        "明治維新では天皇を中心とした政治へと変わり、近代国家づくりが進みました。",
      hint: "江戸時代のあと、新しい国づくりが始まったよ。",
      learningPoint: "明治時代",
      tags: ["明治時代", "明治維新"],
    }),
  ],

  "history-taisho": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "大正時代に広まった、普通の人々にも政治参加を求める動きはどれですか？",
      choices: ["大正デモクラシー", "鎖国", "廃藩置県", "刀狩"],
      correctIndex: 0,
      explanation:
        "大正デモクラシーは、民主主義や普通の人々の政治参加を求める運動が広まった時代です。",
      hint: "「デモクラシー」という言葉が入った動きの名前だよ。",
      learningPoint: "大正時代",
      tags: ["大正時代"],
    }),
  ],

  "history-showa-prewar": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "昭和時代の戦前に日本が関わった大きな戦争はどれですか？",
      choices: [
        "第二次世界大戦（太平洋戦争）",
        "日露戦争だけで終わった",
        "戦争はなかった",
        "明治維新の戦い",
      ],
      correctIndex: 0,
      explanation:
        "昭和時代の戦前には満州事変や太平洋戦争などがあり、国民生活にも大きな影響を与えました。",
      hint: "1945年まで続いた、世界規模の戦争だよ。",
      learningPoint: "昭和時代（戦前）",
      tags: ["昭和時代", "戦争"],
    }),
    mcQuestion(modeId, 1, {
      text: "戦前の国民生活の変化として正しいものはどれですか？",
      choices: [
        "戦争のため物資が不足し、配給などが行われた",
        "何でも自由に買えた",
        "テレビがすべての家にあった",
        "インターネットが普及した",
      ],
      correctIndex: 0,
      explanation:
        "戦時中は物資が不足し、食料や衣料などの配給が行われるなど、くらしは厳しくなりました。",
      hint: "戦争中は食べ物や物が足りなくなることが多かったよ。",
      learningPoint: "昭和時代（戦前）",
      tags: ["昭和時代", "国民生活"],
    }),
  ],

  "history-showa-postwar": (modeId) => [
    mcQuestion(modeId, 0, {
      text: "第二次世界大戦後、日本が受け入れた新しい憲法の特徴として正しいものはどれですか？",
      choices: [
        "戦争を放棄し、国民の権利を大切にする",
        "天皇だけがすべてを決める",
        "武士が政治を行う",
        "外国の法律をそのまま使う",
      ],
      correctIndex: 0,
      explanation:
        "戦後の日本国憲法では戦争の放棄や基本的人権の尊重などが定められました。",
      hint: "平和を大切にする憲法だよ。",
      learningPoint: "昭和時代（戦後）",
      tags: ["昭和時代", "憲法"],
    }),
    mcQuestion(modeId, 1, {
      text: "戦後の高度経済成長期に広まった、くらしの変化として正しいものはどれですか？",
      choices: [
        "電化製品や自動車が家庭に広がった",
        "電気も水道も使えなかった",
        "農業だけが行われた",
        "外国との交流が完全になくなった",
      ],
      correctIndex: 0,
      explanation:
        "戦後の復興と経済成長により、テレビや冷蔵庫、自動車などが生活に広がりました。",
      hint: "おじいちゃん・おばあちゃんの若いころに増えた物を考えてみよう。",
      difficulty: 1,
      learningPoint: "昭和時代（戦後）",
      tags: ["昭和時代", "経済成長"],
    }),
  ],
};

/** 各時代区分の専用問題 */
export function buildHistoryPeriodQuestionsByMode(): Record<
  HistoryModeId,
  Question[]
> {
  const result = {} as Record<HistoryModeId, Question[]>;
  for (const modeId of HISTORY_QUIZ_UNITS) {
    const builder = PERIOD_BUILDERS[modeId];
    result[modeId] = builder ? builder(modeId) : [];
  }
  return result;
}
