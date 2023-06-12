# Spy Cat

**Spy Cat**은 사용자가 보유 중인 서버의 트래픽과 에러를 시각화해주는 웹사이트입니다.  
Spy Cat에서 자신의 서버를 등록하고, 간단한 미들웨어 함수를 서버 소스코드에 추가해 다양한 정보를 쉽게 시각화된 차트로 확인할 수 있습니다.

👉[지금 바로 사용해보기](https://spycat.netlify.app)

# Table of Contents

- [Motivation](#motivation)
- [Challenges](#challenges)
  - [어떻게 서버에서 발생한 트래픽과 에러의 정보를 수집할 수 있을까?](#1-어떻게-서버에서-발생한-트래픽과-에러의-정보를-수집할-수-있을까)
    - [트래픽을 어떻게 수집할 것인가?](#1-트래픽을-어떻게-수집할-것인가)
  - [어떻게 데이터를 시각화할것인가?](#2-어떻게-데이터를-시각화할것인가)
    - [SVG vs Canvas API](#1-svg-vs-canvas-api)
    - [차트를 그릴 데이터를 어떻게 정리할까?](#2-차트를-그릴-데이터를-어떻게-정리할까)
  - [어떻게 실사용 서비스처럼 만들 수 있을까?](#3-어떻게-실사용-서비스처럼-만들-수-있을까)
    - [무분별한 서버요청을 차단해 보자](#1-무분별한-서버요청을-차단해-보자)
    - [UI를 사용자 친화적으로 만들어보자](#2-ui를-사용자-친화적으로-만들어보자)
  - [클라이언트와 서버의 통신문제?](#4-클라이언트와-서버의-통신문제)
    - [로그인 쿠키 문제](#1-로그인-쿠키-문제)
- [Features](#features)
- [Links](#links)
- [Tech Stacks](#tech-stacks)
- [Schedule](#schedule)

# Motivation

이번 프로젝트의 목표는 '**현재 사용할 수 있는 MERN STACK을 다듬고 잘 활용해 실제와 같은 서비스를 구현해 보자**'였습니다.

개발자로서 기술적으로 성장하는 것도 중요했지만 이번 프로젝트에서는 새로운 것을 시도하는 것보다 지금 할 수 있는 것들을 더 다듬고 개선하는 것을 중점으로 잡았습니다.

프로젝트 아이디어를 고민하던 중 New Relic에서 서비스하는 옵저버빌리티 플랫폼을 구현함으로써 그동안 배웠던 기술 스택들을 다듬고 개선할 기회라고 생각했습니다.

# Challenges

## 1. 어떻게 서버에서 발생한 트래픽과 에러의 정보를 수집할 수 있을까?

<br>

### 1) 트래픽을 어떻게 수집할 것인가?

- 트래픽의 정의

  트래픽이란 **웹사이트에 방문한 사람들이 데이터를 주고받은 양** 을 뜻합니다.

데이터를 주고받는다 함은 클라이언트의 요청에 대한 서버의 응답을 나타냅니다. 따라서 트래픽은 서버에 들어오는 요청으로 확인할 수 있었습니다. 또한 서버가 클라이언트로 부터 요청을 받을 때 항상 개별 요청으로 받기 때문에 각각의 트래픽을 감지하는 것은 어렵지 않았습니다.

- 접근 방법

1. 우선 정보를 받아올 미들웨어 함수를 작성했습니다. 클라이언트로부터 들어온 1개의 요청은 서버에서 1개의 응답이 나가야 요청-응답 주기가 종료된다는 점을 이용했습니다.

2. 미들웨어 함수는 요청-응답 주기를 종료하거나 다음 스택의 미들웨어로 제어권을 넘기는 것을 선택할 수 있습니다. 따라서 작성한 미들웨어 함수에서 요청 객체(`req`)에 들어있는 필요한 정보를 얻은 후 다음 스택의 미들웨어 함수를 호출해 제어권을 넘겼습니다.

```js
exports.trafficParser = function (apikey) {
  return async function (req, res, next) {
    try {
      const response = await axios.post(
        `https://eb-spycat.co.kr/api/servers/${apikey}/traffics`,
        {
          type: "traffic",
          path: req.url,
          host: req.headers.host,
        },
      );
      console.log(response.data);
    } catch (error) {
      console.error("Error sending traffic data:", error.message);
    }
    next();
  };
};
```

3. 그리고 각 트래픽이 분기되는 라우팅 분기점보다 위쪽에서 미들웨어 함수를 호출했습니다.  
   `Express`에서 미들웨어는 스택구조로 호출 순서에 따라 영향을 받습니다. 코드의 상단에 위치할수록 먼저 실행됩니다. 따라서 작성한 미들웨어 함수를 라우팅 분기점보다 위쪽에서 호출함으로써 모든 트래픽에 대해 접근이 가능했습니다.

```js
app.use(trafficParser(APIKEY)); // 라우팅 분기점 위에서 요청객체의 정보를 얻고 라우팅으로 요청 객체를 넘김

app.use("/", indexRouter);
app.use("/users", usersRouter);
```

4. 에러 정보의 경우 미들웨어 함수를 만들어 서버의 에러 핸들러 바로 위에서 호출했습니다.  
   `Express`에서 발생한 에러는 각 미들웨어에서 `next(error)`를 호출함으로써 일반 미들웨어를 지나쳐 에러 처리 미들웨어로 제어권을 넘깁니다.  
   통상적으로 에러 처리 미들웨어는 서버의 코드 가장 하단에서 호출하는 이유입니다.

```js
app.use(errorParser(APIKEY)); // 서버의 에러핸들러 바로 위에서 에러객체의 정보를 얻고 에러핸들러로 에러 객체를 넘김

// error handler
app.use(function (err, req, res, next) {
  ...
});
```

- 아쉬운 점

  기능 구현을 마친 뒤 추가적으로 위의 두 개의 함수를 하나로 합칠 수 있다면 사용자 편의성이 좋아질 것 같아 고민해 보았습니다.  
  하지만 라우팅별 분기 처리가 되기 전에 정보를 받아야 하는 트래픽과 반대로 각 분기 내에서 발생한 에러를 동시에 받을 수 있는 적절한 위치를 현재 능력으로는 찾기 어려웠습니다. 추가적인 리서치도 시도해 봤지만 큰 소득은 없었고, 해결하지 못한 부분이 아쉬웠습니다.

<br>

## 2. 어떻게 데이터를 시각화할것인가?

차트를 그리는 라이브러리는 많았지만 기술 스택을 다듬고 성장하는 과정이기에 라이브러리 없이 차트를 구현해 보고자 했습니다.

### 1) SVG vs Canvas API

리서치 결과 많은 개발자들이 차트를 구현할 때 `SVG` 또는 `Canvas API`를 사용한다는 정보를 얻었습니다. 추가적으로 둘의 장단점을 찾아보며 이번 프로젝트에 알맞은 방법이 무엇인지 고민해 봤습니다.

<br>

- 차이점

  |                   SVG                   |                  Canvas API                  |
  | :-------------------------------------: | :------------------------------------------: |
  |   확장성이 뛰어나고 고해상도를 지원함   |  확장성이 떨어지고 고해상도에 적합하지 않음  |
  |     스크립트와 CSS 모두 수정 가능함     |           스크립트로만 수정이 가능           |
  | 다중 그래픽 요소로 이벤트 등록이 간편함 | 단일 HTML 요소로 이벤트 등록이 비교적 복잡함 |

<br>

- 테스트 결과

  동일한 원형 요소를 구현했을 경우 `SVG`와 `Canvas API`를 작성하는 코드량은 아래와 같이 차이가 있었습니다.  
  또한 애니메이션 측면에서도 `SVG`는 `animate`요소로 간단하게 구현이 가능했지만, `Canvas API`는 작성해야 하는 스크립트 양이 월등히 많고 복잡했습니다.

```js
// SVG
<svg width="100" height="100">
  <circle cx="50" cy="50" r="45" fill="#FFA69E">
    <animate
      attributeName="r"
      values="10; 45; 10"
      dur="1s"
      repeatCount="indefinite"
    />
  </circle>
</svg>;

// Canvas API - <script>
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#FFA69E";

let r = 10;
let increase = true;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  ctx.arc(50, 50, r, 0, 2 * Math.PI);
  ctx.fill();

  if (r >= 45) increase = false;
  if (r === 10) increase = true;

  if (increase && r < 45) {
    r += 1;
  } else if (!increase && r >= 10) {
    r -= 1;
  }

  requestAnimationFrame(draw);
}

draw();
```

- 선택한 방법: `SVG`

  이번 프로젝트의 경우 웹브라우저 화면으로 대형 사이즈의 차트를 제공해야 했으므로 고해상도의 그래픽이 필요했습니다. 그래프를 렌더링 할 때 애니메이션도 추가하고자 했습니다.  
  그리고 차트 요소를 클릭했을 때 상세 차트가 추가로 렌더링 되는 클릭 이벤트를 그래픽 요소에 추가하려고 했습니다.

  해상도, 애니메이션 효과, 이벤트 등록 등을 고려했을 때 `SVG`가 더 적합하다고 생각했습니다. 선정한 `SVG`를 이용해 웹브라우저에서도 선명하고 간단한 애니메이션 효과를 추가한 차트를 손쉽게 구현할 수 있었습니다.

  <img width="450" src="https://github.com/gunhwalee/spycat-client/assets/110829006/9810a40f-4675-4d4b-b1cb-4170c5f1f4f3">

<br>

### 2) 차트를 그릴 데이터를 어떻게 정리할까?

- 접근 방법

1. 직접 `SVG`를 이용한 차트 구현을 해본 경험이 없었기 때문에 차트를 구현할 함수를 먼저 작성해 보고
2. 그 이후에 차트에 필요한 데이터 포맷을 기준으로 DB에 저장된 정보를 가공하기로 결정했습니다.

- 차트 구현 (도넛 차트)

  1. 데이터마다 `circle`요소를 그리고 `stroke-width`속성을 사용해 도넛 형태의 이미지를 구현했습니다.
  2. 각 데이터 항목이 전체 데이터에서 차지하는 비중을 구하고, `stroke-dasharray`속성에서 대시와 공백을 표시하는 변수를 활용했습니다.
     - `const strokeLength = circumference * ratio;`  
       (데이터가 차지하는 비중만큼의 길이)
     - `const spaceLength = circumference - strokeLength;`  
       (데이터를 제외한 공백의 길이)
     - `strokeDasharray={strokeLength spaceLength}`  
       (데이터의 비중만큼 `circle`요소의 길이 조절)
  3. 각 `circle`요소가 동일한 시작점에서 그려지기 때문에, `stroke-dashoffset`속성을 조절했습니다.
     - `filled += ratio;` (각 데이터 직전까지의 누적 비중)
     - `const offset = fiiled * circumference`
     - `strokeDashoffset={-offset}` (`circle`요소의 시작지점)

<br>

- 구현 결과

  [작성 코드](https://github.com/gunhwalee/spycat-client/blob/main/src/charts/DonutChart.js)

  <img src="https://github.com/gunhwalee/spycat-client/assets/110829006/5bb7b5b4-9bb7-4f62-9d39-de9aace75266" width="250">

<br>

- 데이터 가공

  만들어진 함수를 이용하기 위해서 데이터는 이름(라벨)과 값 속성을 가진 객체로 이루어져야 했습니다. 따라서 DB에서 넘어온 데이터를 아래와 같은 형식으로 가공해야 했습니다.

```js
// DB 데이터
const data1 = {
  path: "/",
  server: ObjectId,
  createAt: 2023-05-29T05:30:20.051+00:00,
};

const traffics = [data1, data2, ...];

// 타깃 형식
const routesTraffics = [
  { name: "/", value: 24 },
  { name: "/login", value: 16 },
  { name: "/signup", value: 8 },
];
```

1. 먼저 차트별 분류 기준을 `name`속성으로 정의해야 했습니다. (차트별로 각각 날짜, 라우팅, 시간)
2. `traffics` 배열을 순회하면서 `name`속성에 해당할 때마다 `value`값을 업데이트했습니다.
3. 이때 시간의 경우 DB에 UTC 기준으로 저장을 하고 클라이언트에서 로컬 시간으로 변환해 지역별 시간 혼동을 방지했습니다.

- 결과물

  [작성 코드](https://github.com/gunhwalee/spycat-client/blob/main/src/handlers/trafficInfoHandlers.js)

<br>

## 3. 어떻게 실사용 서비스처럼 만들 수 있을까?

프로젝트 이전, 교육기간 동안은 내가 작성한 로직이 정상작동하는지에만 관심이 쏠려있었습니다. 그렇다 보니 사용자가 느끼는 불편함은 크게 고민해 본 적이 없었습니다.

그래서 프로젝트를 진행하면서 '실제 사용되는 서비스처럼 웹사이트를 구현해 보자'라는 작은 목표를 가지고 진행했습니다.

<br>

### 1) 무분별한 서버요청을 차단해 보자

- 문제점

  클라이언트에서 들어오는 요청은 클라이언트 주소에 접속한 사용자에 한해서 일어나는 일입니다.  
  하지만 `npm`패키지에서 들어오는 요청은 `npm`을 사용할 줄 아는 사람이라면 누구나 요청 전송이 가능했습니다.  
  또한 클라이언트 사용자는 인증 토큰을 통해 식별이 가능했지만, `npm`패키지를 사용하는 프로젝트(여기서는 함수를 호출한 사용자의 서버)를 식별할 방법이 없다는 문제도 있었습니다.

- 접근 방법

  인증과 API KEY에 대해 리서치해 보고 그 차이점을 정리해 봤습니다.

  |              인증(Authenticate)              |                   API KEY                   |
  | :------------------------------------------: | :-----------------------------------------: |
  |        앱이나 사이트의 사용자를 식별         |      API를 호출하는 앱이나 사이트 식별      |
  | 사용자에게 요청을 위한 접근 권한 여부를 확인 | 프로젝트가 API에 대한 접근 권한 여부를 확인 |

  따라서 사이트 사용자에게 등록한 서버마다 API KEY를 발급하고, 해당 키를 `npm`패키지 함수의 인자로 받아 접근 권한을 부여할 수 있었습니다.

  <img width="400" src="https://github.com/gunhwalee/spycat-client/assets/110829006/fc740342-412e-412a-bae2-48caaf2569be">

<br>

### 2) UI를 사용자 친화적으로 만들어보자

- 문제점

  프로젝트에서 적용된 드롭 다운 메뉴와 슬라이드 메뉴를 사용하는 과정에서 불편함을 느낀 부분이 있었습니다.  
  보통 드롭 다운 메뉴의 경우 불리언 값을 나타내는 상태를 생성하고, 마우스 이벤트(클릭 또는 호버)에 상태를 업데이트해 드롭 다운 메뉴를 마운트, 언마운트하는 방식으로 사용합니다.

  여기서 이벤트가 발생할 때 해당 컴포넌트 요소가 바로 화면에 나타나거나 사라지기 때문에 선택하고자 하는 메뉴가 의도치 않게 빠르게 움직이는 현상이 있었습니다.

  <img width="150" src="https://github.com/gunhwalee/spycat-client/assets/110829006/93193d00-e952-416a-baf7-beede808dd40">

- 해결 방법

  이런 문제를 해결하고자 애니메이션 효과를 추가했습니다.  
  처음에 CSS에 `animation`속성을 추가했지만 적용이 되지 않았습니다.  
  상태 값이 `true`에서 `false`로 바뀌는 순간 애니메이션이 적용돼야 하지만 `DOM`에서 해당 요소가 언마운트되다 보니 애니메이션이 적용되지 않고 곧바로 사라지는 현상이 있었습니다.

  이를 해결하기 위해 애니메이션을 트리거 할 수 있는 상태와 컴포넌트를 마운트 하는 상태를 별도로 만들어 문제를 해결했습니다.

  <img width="150" src="https://github.com/gunhwalee/spycat-client/assets/110829006/f8352322-ca87-4b6b-93eb-2dd64064609e">

- 추가 고려 사항

  **마우스 호버 이벤트**

  마우스 호버 이벤트는 `mouseover`와 `mouseenter`로 나눠집니다. 두 가지 모두 마우스가 요소를 가리킬 경우 발생하지만 큰 차이점이 하나 있습니다.  
   바로 이벤트 버블링 유무입니다.
  `mouseover`이벤트는 이벤트 버블링이 적용되기 때문에 드롭 다운 메뉴에서 사용할 경우 새로운 하위 요소를 가리킬 때마다 이벤트다 다시 발생합니다.  
   그렇게 되면 마우스로 메뉴 목록을 이동할 때마다 드롭 다운 메뉴가 다시 나타나기 때문에 이 경우엔 적절하지 않았습니다.

  **아마존 홈페이지의 메뉴를 살펴보고 느낀점**

  아마존 홈페이지의 메뉴를 살펴보면 각 메뉴에 마우스 호버 시 우측에 서브메뉴가 나옵니다.  
  이때 보통의 메뉴바는 우측의 서브메뉴로 마우스를 옮기는 과정에서 서브메뉴가 바뀌는 상황을 종종 보곤 했습니다.  
  그런데 아마존의 메뉴는 마우스가 움직일 때 다른 메뉴에 호버가 되더라도 서브메뉴가 바뀌지 않았습니다.  
  정말 신기한 기능이었고, 드롭다운 메뉴에도 적용하고 싶었지만 도저히 방법을 찾을 수 없었습니다.  
  향후에 역량이 쌓인다면 꼭 도전해 보고 싶은 기능입니다.

<br>

## 4. 클라이언트와 서버의 통신문제?

부트 캠프 교육기간 동안은 모놀리스 구조로 작업을 했었습니다. 그렇다 보니 클라이언트와 서버 간의 요청을 주고받는 상황에서 큰 어려움이 없었습니다.  
하지만 이번 프로젝트에서 서버와 클라이언트를 별도로 구성하다 보니 문제점이 있었습니다.

<br>

### 1) 로그인 쿠키 문제

- 문제점

  기능 구현이 완료된 후 실제 배포를 진행하면서 로그인 과정에서 추가적인 문제도 발생했었습니다.  
  로컬 환경에서는 로그인 후 발급된 토큰이 클라이언트에 정상적으로 저장됐었지만, 프로덕션 환경에서는 쿠키에 저장되지 않는 문제점이 있었습니다.  
  로그인은 정상적으로 진행되었지만 로그인 후 발급된 토큰이 저장되지 않아 다음 요청이 인가 로직을 통과하지 못하는 것이 문제였습니다.

- 접근 방법

  우선 `Express` 공식 문서를 찾아보니 제가 설정하지 않았던 `sameSite`라는 설정이 있었습니다.  
  쿠키에서 `SameSite`속성은 HTTP Working Group이 2016년에 발표한 RFC6265에 포함된 내용으로, **쿠키를 자사 및 동일 사이트 컨텍스트로 제한해야 하는지**를 설정하는 것이었습니다.

  해당 속성은 `Strict`, `Lax`, `None` 3가지 값이 설정 가능했습니다.

  - `Strict`: 가장 보수적인 설정으로 크로스 사이트 요청에는 항상 전송되지 않습니다.
  - `Lax`: `Strict`보다 한 단계 느슨한 설정으로 Top Level Navigation(웹 페이지 이동)과 안전한 HTTP 메서드(`GET`) 요청에 한 해 크로스 사이트 요청에도 쿠키가 전송됩니다.
  - `None`: `SameSite`속성이 생기기 전 브라우저 작동 방식과 동일하게 작동됩니다.

  발생한 문제의 경우 로그인 과정에서 발생한 문제로 크로스 사이트에서 `POST` 메서드를 사용하고 있었기 때문에 속성값을 `None`으로 설정해야 했습니다.

```js
// 쿠키를 응답하는 로직
res
  .status(201)
  .cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  })
  .send(
    ... // 클라이언트로 응답할 내용
  );
```

`sameSite`속성 설정 후 문제가 해결될 것이라 생각했지만 `typeError: option sameSite is invalid`라는 에러가 발생했습니다.  
리서치 결과 다행히 `express` 버전 문제였고 버전 업데이트 후 쉽게 해결할 수 있었습니다. (`express-generator`로 생성할 경우 4.16버전이 설치되는데 해당버전에서는 `sameSite` 옵션을 지원하지 않습니다.)

<br>

# Features

- 로그인 이전 예시용 차트를 통해 대략적인 서비스 내용을 확인할 수 있습니다.
- 로그인 후 좌측의 사이드 바에서 서버를 등록할 수 있습니다.
- 사용자가 등록한 서버별 트래픽, 에러 정보를 제공합니다.
- 트래픽 차트는 오늘 기준 최근 28일의 트래픽 정보, 라우팅별 트래픽, 트래픽 발생 시간을 확인할 수 있습니다.
- 에러 차트는 오늘 기준 최근 28일의 에러 발생 정보, 라우팅별 에러, 에러 발생 시간을 확인할 수 있습니다.
- 각 차트는 날짜를 클릭해 해당 날짜에 발생한 라우팅별 정보, 발생 시간을 확인할 수 있습니다.
- 사용자는 마이페이지에서 등록된 서버를 관리할 수 있고(생성, 삭제), 서버마다 발급된 API KEY를 확인할 수 있습니다.
- API KEY는 클립보드에 복사가 가능하며, 재발급 버튼으로 재발급 받을 수 있습니다.

<br>

# Links

Live Server

- [Spy Cat](https://spycat.netlify.app)

Github Repositories

- [Frontend](https://github.com/spy-cat-0/spycat-client)
- [Backend](https://github.com/spy-cat-0/spycat-server)

# Tech Stacks

Frontend

- React
- Redux
- Redux Toolkit
- Styled Components

Backend

- Node.js
- Express
- MongoDB
- Mongoose

# Schedule

2023.04.03 ~ 2023.04.21 : 3주

- 아이디어 기획, Mock up 작업 : 1주
- 프로젝트 개발 : 2주
