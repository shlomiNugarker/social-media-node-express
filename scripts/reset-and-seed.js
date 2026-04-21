#!/usr/bin/env node
/**
 * Reset + Seed script for TravelsDin.
 *
 *   node scripts/reset-and-seed.js
 *
 * Wipes all collections (user/post/activity/chat) and seeds:
 *   - 1 main test user: username=test / password=1234
 *   - 5 additional seed users
 *   - ~10 posts across all users (some with images, some with geo)
 *   - reactions + comments + replies on posts
 *   - follow relations
 *   - 2 chats between test user and seed users
 */

require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const DB_URI = process.env.DB_URI;
const DB_NAME = "social_network_db";

if (!DB_URI) {
  console.error("missing DB_URI env var. ensure .env is present in backend.");
  process.exit(1);
}

// ---------- sample data ----------
const FIRST_NAMES = ["יעל", "דנה", "עומר", "שירה", "איתי", "רון", "מאיה"];
const LAST_NAMES = ["כהן", "לוי", "פרידמן", "ברק", "מזרחי", "אדלר"];
const PROFESSIONS = [
  "מפתח/ת תוכנה",
  "מעצב/ת UX",
  "צלם/ת",
  "יועץ/ת שיווק",
  "אדריכל/ית",
];
const BIOS = [
  "אוהב/ת לטייל, לצלם ולגלות מקומות חדשים.",
  "מחפש/ת את הקפה הכי טוב בעיר — וגם פוגש/ת אנשים בדרך.",
  "מתלהב/ת ממדבריות, ים ואוכל טוב.",
  "טיפוס/ה של כביש פתוח ומצלמה ביד.",
  "מבלה את רוב הזמן בין הים לרי״ם לבן.",
];

const POST_CONTENTS = [
  // Israel
  {
    title: "שקיעה בים המלח",
    body: "היום תפסנו את השקיעה הכי יפה שראיתי השנה — הצבעים פשוט לא נגמרים. ממליץ לכל מי שלא היה בזמן האחרון לעלות לאזור.",
    img: "https://picsum.photos/seed/deadsea/800/520",
    lat: 31.5497,
    lng: 35.4663,
    country: "ישראל",
    category: "nature",
  },
  {
    title: "בוקר בתל אביב",
    body: "ריצת בוקר על החוף, קפה בפלורנטין, ויום חדש שמתחיל. אין כמו העיר הזו בבוקר.",
    img: "https://picsum.photos/seed/telaviv/800/520",
    lat: 32.0568,
    lng: 34.7699,
    country: "ישראל",
    category: "city",
  },
  {
    title: "טיול במכתש רמון",
    body: "שלושה ימים של צפייה בכוכבים, הליכה בנקיקים, ואוכל על האש. כל פעם מחדש המכתש מפתיע.",
    img: "https://picsum.photos/seed/ramon/800/520",
    lat: 30.6125,
    lng: 34.8011,
    country: "ישראל",
    category: "hiking",
  },
  {
    title: "שבת שלום מירושלים",
    body: "יום של עיר שקטה, בתי קפה במאה שערים, ואור מיוחד שיש רק פה.",
    img: "https://picsum.photos/seed/jerusalem/800/520",
    lat: 31.7767,
    lng: 35.2345,
    country: "ישראל",
    category: "culture",
  },
  {
    title: "חיפה מהכרמל",
    body: "הנוף הזה לא מתיישן. גם אחרי עשרות פעמים, עדיין עוצר לי את הנשימה.",
    img: "https://picsum.photos/seed/haifa/800/520",
    lat: 32.7956,
    lng: 34.9833,
    country: "ישראל",
    category: "nature",
  },
  {
    title: "צלילה באילת",
    body: "ים חם, שוניות צבעוניות וסנפיריות. גם אחרי 20 צלילות, באילת יש משהו ייחודי.",
    img: "https://picsum.photos/seed/eilat/800/520",
    lat: 29.5581,
    lng: 34.9482,
    country: "ישראל",
    category: "beach",
  },

  // Europe
  {
    title: "קרואסון מושלם בפריז",
    body: "שכונה שקטה ב-Le Marais, מאפייה קטנה, וקרואסון שהוא חוויה. זו הסיבה לחזור כל פעם מחדש.",
    img: "https://picsum.photos/seed/paris/800/520",
    lat: 48.8566,
    lng: 2.3522,
    country: "צרפת",
    category: "food",
  },
  {
    title: "לילה במדריד",
    body: "טאפאס בגראן ויה, רחוב שמתנגן ובירה מקומית. ספרד בלילה זו חוויה שלא שוכחים.",
    img: "https://picsum.photos/seed/madrid/800/520",
    lat: 40.4168,
    lng: -3.7038,
    country: "ספרד",
    category: "nightlife",
  },
  {
    title: "גאודי בברצלונה",
    body: "Sagrada Familia סוף סוף ראיתי בעיניים. אין תמונה שמתקרבת למה שעובר עליך שם.",
    img: "https://picsum.photos/seed/barcelona/800/520",
    lat: 41.3851,
    lng: 2.1734,
    country: "ספרד",
    category: "culture",
  },
  {
    title: "פיצה ברומא",
    body: "פיצה דקה, בזיליקום טרי, ושמן זית שלא ידעתי שקיים. טרסטוורה בטקס.",
    img: "https://picsum.photos/seed/rome/800/520",
    lat: 41.9028,
    lng: 12.4964,
    country: "איטליה",
    category: "food",
  },
  {
    title: "סרנדה בוונציה",
    body: "גונדולה, תעלה, ואיש עם אקורדיון. קיטש — אבל מהסוג שאתה זוכר כל החיים.",
    img: "https://picsum.photos/seed/venice/800/520",
    lat: 45.4408,
    lng: 12.3155,
    country: "איטליה",
    category: "culture",
  },
  {
    title: "הרי האלפים בסוויס",
    body: "רכבל לאינטרלאקן, מסלול של 4 שעות, ושלג שמגיע עד לברכיים. לא קל — שווה.",
    img: "https://picsum.photos/seed/swiss/800/520",
    lat: 46.6863,
    lng: 7.8632,
    country: "שווייץ",
    category: "adventure",
  },
  {
    title: "בירה באוקטוברפסט",
    body: "מינכן במלואה — דיריגנלים, פרצלים ענקיים ואווירה שאי אפשר לתאר. הייתי שוב מחר.",
    img: "https://picsum.photos/seed/munich/800/520",
    lat: 48.1351,
    lng: 11.5820,
    country: "גרמניה",
    category: "nightlife",
  },
  {
    title: "Big Ben בלונדון",
    body: "יום מושלם — מוזיאון הברזל, שייט בתמזה, ופיש אנד צ׳יפס בפאב קלאסי.",
    img: "https://picsum.photos/seed/london/800/520",
    lat: 51.5007,
    lng: -0.1246,
    country: "בריטניה",
    category: "city",
  },

  // North America
  {
    title: "Times Square בלילה",
    body: "רעש, אורות, אנשים — ניו יורק במיטבה. גם אחרי הביקור החמישי, זה עדיין מטורף.",
    img: "https://picsum.photos/seed/nyc/800/520",
    lat: 40.7580,
    lng: -73.9855,
    country: "ארה״ב",
    category: "city",
  },
  {
    title: "גרנד קניון",
    body: "סאנרייז על שולי הקניון. 20 דקות של שקט מוחלט, ואחר כך הצבעים מתפוצצים. חוויה רוחנית.",
    img: "https://picsum.photos/seed/grandcanyon/800/520",
    lat: 36.1069,
    lng: -112.1129,
    country: "ארה״ב",
    category: "nature",
  },

  // Asia
  {
    title: "מקדש בטוקיו",
    body: "Senso-ji בבוקר — כמעט ריק, ריח של קטורת ופעמונים של הטקס הראשון. מצב שונה לגמרי.",
    img: "https://picsum.photos/seed/tokyo/800/520",
    lat: 35.7148,
    lng: 139.7967,
    country: "יפן",
    category: "culture",
  },
  {
    title: "סושי בשוק צוקיג׳י",
    body: "חמישה בבוקר בשוק, ואני אוכל את הסושי הכי טרי בחיי. ישר מהסירה.",
    img: "https://picsum.photos/seed/tsukiji/800/520",
    lat: 35.6654,
    lng: 139.7707,
    country: "יפן",
    category: "food",
  },
  {
    title: "חוף בבאלי",
    body: "Uluwatu — גלים מושלמים לגולשים, שקיעה שעוצרת את הנשימה. בלי מילים.",
    img: "https://picsum.photos/seed/bali/800/520",
    lat: -8.8290,
    lng: 115.0849,
    country: "אינדונזיה",
    category: "beach",
  },
  {
    title: "שוק לילה בבנגקוק",
    body: "פאד תאי על מקל, מיצי פירות טריים ופעילות שלא נגמרת. להפחית מהסחלב היה קל מדי.",
    img: "https://picsum.photos/seed/bangkok/800/520",
    lat: 13.7563,
    lng: 100.5018,
    country: "תאילנד",
    category: "food",
  },

  // Misc / no-position (still valid posts)
  {
    title: "ספר חדש בידיים",
    body: "התחלתי אתמול ובקושי הצלחתי לעצור. אם יש לכם המלצות לספרים באותו סגנון — אשמח.",
    img: null,
    lat: null,
    lng: null,
    country: null,
    category: null,
  },
  {
    title: "פרויקט חדש יוצא לדרך",
    body: "חודשים של תכנון — סוף סוף יוצאים. פרטים בקרוב 🤫",
    img: null,
    lat: null,
    lng: null,
    country: null,
    category: null,
  },
];

const COMMENT_POOL = [
  "וואו, מרשים!",
  "מדהים, תודה ששיתפת",
  "איזה כיף, אני חייב לנסות",
  "הצילום הזה פשוט יפה",
  "איפה זה בדיוק?",
  "נהניתי לקרוא — ממשיך לעקוב",
  "נשמע מושלם",
  "תמשיך לפרסם דברים כאלה",
  "איזה תובנה יפה",
  "איזה מקום מטורף!",
];

const REPLY_POOL = [
  "תודה!",
  "מסכים לחלוטין",
  "חייב להצטרף בפעם הבאה",
  "גם אני שמעתי טובות",
  "כבר מזמן רציתי",
];

const AVATARS = [
  "https://i.pravatar.cc/300?img=12",
  "https://i.pravatar.cc/300?img=20",
  "https://i.pravatar.cc/300?img=33",
  "https://i.pravatar.cc/300?img=47",
  "https://i.pravatar.cc/300?img=51",
  "https://i.pravatar.cc/300?img=60",
];

const COVERS = [
  "https://picsum.photos/seed/cover1/1200/300",
  "https://picsum.photos/seed/cover2/1200/300",
  "https://picsum.photos/seed/cover3/1200/300",
];

// ---------- helpers ----------
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const makeId = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2, 6);

function hoursAgo(hours) {
  return Date.now() - hours * 60 * 60 * 1000;
}

async function main() {
  const client = await MongoClient.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const db = client.db(DB_NAME);

  console.log("> connected to DB");

  // ---------- 1. WIPE ----------
  const toWipe = ["user", "post", "activity", "chat"];
  for (const name of toWipe) {
    const res = await db.collection(name).deleteMany({});
    console.log(`  wiped ${name}: removed ${res.deletedCount}`);
  }

  // ---------- 2. CREATE USERS ----------
  const now = Date.now();
  const userCol = db.collection("user");

  const mainUser = {
    fullname: "שלומי בודק",
    profession: "מפתח Full-Stack",
    bio: "בודק את המערכת יום יום — מחפש באגים, דברים יפים ומקומות חדשים לטייל בהם.",
    age: 28,
    createdAt: hoursAgo(24 * 30),
    connections: [],
    following: [],
    followers: [],
    gender: "זכר",
    phone: "050-1234567",
    birthDate: "1997-01-01",
    email: "test@travelsdin.dev",
    bg: COVERS[0],
    position: { lat: 32.0853, lng: 34.7818 },
    imgUrl: "https://i.pravatar.cc/300?img=7",
    isAdmin: false,
    googleId: null,
  };
  const mainRes = await userCol.insertOne(mainUser);
  mainUser._id = mainRes.insertedId;
  console.log(`  ✓ main user: ${mainUser.email} (id=${mainUser._id})`);

  const seedUsers = [];
  for (let i = 0; i < 5; i++) {
    const fullname = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const user = {
      fullname,
      profession: pick(PROFESSIONS),
      bio: pick(BIOS),
      age: 22 + Math.floor(Math.random() * 20),
      createdAt: hoursAgo(24 * (5 + i)),
      connections: [],
      following: [],
      followers: [],
      gender: chance(0.5) ? "זכר" : "נקבה",
      phone: null,
      birthDate: null,
      email: `user${i + 1}@travelsdin.dev`,
      bg: pick(COVERS),
      position: chance(0.7)
        ? {
            lat: 31.5 + Math.random() * 1.5,
            lng: 34.5 + Math.random() * 1.5,
          }
        : null,
      imgUrl: AVATARS[i % AVATARS.length],
      isAdmin: false,
      googleId: null,
    };
    const r = await userCol.insertOne(user);
    user._id = r.insertedId;
    seedUsers.push(user);
  }
  console.log(`  ✓ created ${seedUsers.length} seed users`);

  // ---------- 3. FOLLOW RELATIONS ----------
  // main follows 4 of 5, and 3 of 5 follow main back
  const mainFollows = seedUsers.slice(0, 4).map((u) => String(u._id));
  const mainFollowers = seedUsers.slice(1, 4).map((u) => String(u._id));
  await userCol.updateOne(
    { _id: mainUser._id },
    {
      $set: {
        following: mainFollows,
        followers: mainFollowers,
        connections: mainFollows,
      },
    }
  );
  // update seed users' followers/following to mirror
  for (const u of seedUsers) {
    const followers = [];
    const following = [];
    if (mainFollows.includes(String(u._id))) followers.push(String(mainUser._id));
    if (mainFollowers.includes(String(u._id))) following.push(String(mainUser._id));
    // cross-follow a bit between seed users
    for (const other of seedUsers) {
      if (String(other._id) === String(u._id)) continue;
      if (chance(0.3)) following.push(String(other._id));
    }
    await userCol.updateOne(
      { _id: u._id },
      { $set: { followers, following, connections: following } }
    );
  }
  console.log(`  ✓ follow relations set`);

  // ---------- 4. POSTS ----------
  const allUsers = [mainUser, ...seedUsers];
  const postCol = db.collection("post");
  const posts = [];

  for (let i = 0; i < POST_CONTENTS.length; i++) {
    const content = POST_CONTENTS[i];
    // main user writes ~2, rest spread across seed users
    const author = i < 2 ? mainUser : pick(seedUsers);
    const createdAt = hoursAgo(1 + i * 3.3);

    // 2–4 likes
    const likerPool = allUsers.filter((u) => String(u._id) !== String(author._id));
    const likers = likerPool
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 3));
    const reactions = likers.map((u) => ({
      userId: String(u._id),
      fullname: u.fullname,
      imgUrl: u.imgUrl,
    }));

    // 1–3 comments, each possibly with 0–2 replies
    const commenterPool = allUsers.filter(
      (u) => String(u._id) !== String(author._id)
    );
    const comments = [];
    const commentCount = 1 + Math.floor(Math.random() * 3);
    for (let c = 0; c < commentCount; c++) {
      const commenter = pick(commenterPool);
      const replies = [];
      const replyCount = chance(0.4) ? 1 + Math.floor(Math.random() * 2) : 0;
      for (let r = 0; r < replyCount; r++) {
        const replier = pick(allUsers);
        replies.push({
          _id: makeId(),
          postId: null, // filled after post insert
          userId: String(replier._id),
          fullname: replier.fullname,
          imgUrl: replier.imgUrl,
          txt: pick(REPLY_POOL),
          reactions: [],
          createdAt: createdAt + (c + 1) * 60 * 1000 * (r + 2),
        });
      }
      comments.push({
        _id: makeId(),
        postId: null,
        userId: String(commenter._id),
        fullname: commenter.fullname,
        imgUrl: commenter.imgUrl,
        txt: pick(COMMENT_POOL),
        reactions: chance(0.3)
          ? [
              {
                userId: String(pick(allUsers)._id),
                fullname: pick(allUsers).fullname,
              },
            ]
          : [],
        replies,
        createdAt: createdAt + (c + 1) * 5 * 60 * 1000,
      });
    }

    const post = {
      userId: String(author._id),
      fullname: author.fullname,
      imgUrl: author.imgUrl,
      title: content.title,
      body: content.body,
      style: null,
      reactions,
      comments, // postId patched below
      shares: [],
      createdAt,
      imgBodyUrl: content.img || undefined,
      videoBodyUrl: undefined,
      link: undefined,
      position:
        content.lat && content.lng
          ? { lat: content.lat, lng: content.lng }
          : null,
      country: content.country || undefined,
      category: content.category || undefined,
    };

    const r = await postCol.insertOne(post);
    post._id = r.insertedId;

    // patch postId on every comment/reply
    const postIdStr = String(post._id);
    post.comments = post.comments.map((c) => ({
      ...c,
      postId: postIdStr,
      replies: (c.replies ?? []).map((rr) => ({ ...rr, postId: postIdStr })),
    }));
    await postCol.updateOne(
      { _id: post._id },
      { $set: { comments: post.comments } }
    );

    posts.push(post);
  }
  console.log(`  ✓ created ${posts.length} posts`);

  // ---------- 5. CHATS ----------
  const chatCol = db.collection("chat");
  const chatTargets = seedUsers.slice(0, 2); // two chats
  const sampleMessages = [
    [
      { fromMain: false, txt: "היי! ראיתי את הפוסט האחרון שלך, ממש מגניב" },
      { fromMain: true, txt: "תודה! עבדתי על זה זמן מה :)" },
      { fromMain: false, txt: "באמת רואים, נוצר מצוין" },
      { fromMain: true, txt: "מעריך מאוד" },
    ],
    [
      { fromMain: true, txt: "יוצאים ביחד לטיול בסופ״ש?" },
      { fromMain: false, txt: "בטוח, לאיפה חשבת?" },
      { fromMain: true, txt: "חשבתי על רמון — השקיעות שם מטורפות" },
      { fromMain: false, txt: "מושלם. נסגור פרטים בקרוב" },
    ],
  ];

  for (let i = 0; i < chatTargets.length; i++) {
    const other = chatTargets[i];
    const baseTime = hoursAgo(2 + i * 3);
    const messages = sampleMessages[i].map((m, idx) => ({
      _id: makeId(),
      userId: m.fromMain ? String(mainUser._id) : String(other._id),
      fullname: m.fromMain ? mainUser.fullname : other.fullname,
      imgUrl: m.fromMain ? mainUser.imgUrl : other.imgUrl,
      txt: m.txt,
      createdAt: baseTime + idx * 60 * 1000,
    }));
    const chat = {
      userId: String(mainUser._id),
      userId2: String(other._id),
      users: [
        {
          _id: String(mainUser._id),
          fullname: mainUser.fullname,
          imgUrl: mainUser.imgUrl,
        },
        {
          _id: String(other._id),
          fullname: other.fullname,
          imgUrl: other.imgUrl,
        },
      ],
      messages,
      createdAt: baseTime,
    };
    await chatCol.insertOne(chat);
  }
  console.log(`  ✓ created ${chatTargets.length} chats with main user`);

  // ---------- 6. ACTIVITIES (notifications for main user) ----------
  const actCol = db.collection("activity");
  const notifs = [];
  // 2 follows
  for (let i = 0; i < 2; i++) {
    const actor = seedUsers[i + 1];
    notifs.push({
      targetUserId: String(mainUser._id),
      createdBy: String(actor._id),
      createdByFullname: actor.fullname,
      createdByImgUrl: actor.imgUrl,
      body: "התחיל/ה לעקוב אחריך",
      read: false,
      linkTo: `/profile/${actor._id}`,
      createdAt: hoursAgo(1 + i),
    });
  }
  // 2 likes on main's posts
  const mainPosts = posts.filter(
    (p) => String(p.userId) === String(mainUser._id)
  );
  for (const p of mainPosts) {
    const liker = pick(seedUsers);
    notifs.push({
      targetUserId: String(mainUser._id),
      createdBy: String(liker._id),
      createdByFullname: liker.fullname,
      createdByImgUrl: liker.imgUrl,
      body: "אהב את הפוסט שלך",
      read: false,
      postId: String(p._id),
      linkTo: `/post/${mainUser._id}/${p._id}`,
      createdAt: hoursAgo(3),
    });
  }
  // 1 comment
  if (mainPosts[0]) {
    const commenter = pick(seedUsers);
    notifs.push({
      targetUserId: String(mainUser._id),
      createdBy: String(commenter._id),
      createdByFullname: commenter.fullname,
      createdByImgUrl: commenter.imgUrl,
      body: "הגיב על הפוסט שלך",
      read: true,
      postId: String(mainPosts[0]._id),
      linkTo: `/post/${mainUser._id}/${mainPosts[0]._id}`,
      createdAt: hoursAgo(5),
    });
  }
  if (notifs.length > 0) {
    await actCol.insertMany(notifs);
    console.log(`  ✓ created ${notifs.length} notifications for main user`);
  }

  await client.close();
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✓ DONE. Sign in with Google using one of the seed emails:");
  console.log("   test@travelsdin.dev (main user)");
  console.log("   user1@travelsdin.dev … user5@travelsdin.dev");
  console.log("");
  console.log("On first Google sign-in, the matching account will be linked");
  console.log("by email and the googleId will be stored.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
