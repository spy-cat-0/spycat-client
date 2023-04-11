import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import * as S from "../styles/UserInputStyle";
import { ReactComponent as Id } from "../assets/img/id.svg";
import { ReactComponent as Password } from "../assets/img/password.svg";
import { ReactComponent as PasswordCheck } from "../assets/img/password-check.svg";
import { ReactComponent as Eye } from "../assets/img/eye.svg";
import { ReactComponent as EyeSlash } from "../assets/img/eye-slash.svg";
import logo from "../assets/img/logo.jpg";

function Signup() {
  const [info, setInfo] = useState({
    name: null,
    id: null,
    pw: null,
    pwCheck: null,
  });
  const [nameFocus, setNameFocus] = useState(false);
  const [idFocus, setIdFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async event => {
    event.preventDefault();
    setErrorMessage("");

    if (info.pw !== info.pwCheck)
      return setErrorMessage("비밀번호가 동일하지 않습니다.");

    try {
      setDisabled(true);
      const response = await axios.post(
        `${process.env.REACT_APP_SPYCAT_SERVER}/users`,
        info,
      );

      setDisabled(false);
      if (response.data.result === "error") {
        return setErrorMessage(response.data.message);
      }

      navigate("/login");
    } catch (error) {
      console.error(error);
      setDisabled(false);
      return setErrorMessage(
        "서버 접속이 원활하지 않습니다. 잠시 후 시도해주세요.",
      );
    }
  };

  const inputHandler = event => {
    const newInfo = { ...info };
    switch (event.target.id) {
      case "name":
        newInfo.name = event.target.value;
        setInfo(newInfo);
        break;

      case "id":
        newInfo.id = event.target.value;
        setInfo(newInfo);
        break;

      case "pw":
        newInfo.pw = event.target.value;
        setInfo(newInfo);
        break;

      case "pwCheck":
        newInfo.pwCheck = event.target.value;
        setInfo(newInfo);
        break;

      default:
        break;
    }
  };

  const pwHandler = () => {
    setShowPw(!showPw);
  };

  return (
    <S.EntryWrapper>
      <header className="logo-header">
        <img alt="logo" src={logo} width="60px" height="60px" />
        <h1>Spy Cat</h1>
      </header>
      <form id="submit-form" onSubmit={handleSubmit}>
        <div className="inner-pannel">
          <div className="box">
            <Id width="20px" height="20px" />
            <input
              type="text"
              id="name"
              placeholder="이름"
              minLength="1"
              maxLength="10"
              onChange={inputHandler}
              onFocus={() => setNameFocus(true)}
              onBlur={() => setNameFocus(false)}
            />
          </div>
          <div
            className="rule"
            style={{ visibility: nameFocus ? "visible" : "hidden" }}
          >
            이름은 최대 10자입니다.
          </div>
          <div className="box">
            <Id width="20px" height="20px" />
            <input
              type="email"
              id="id"
              placeholder="아이디(이메일)"
              maxLength="40"
              onChange={inputHandler}
              onFocus={() => setIdFocus(true)}
              onBlur={() => setIdFocus(false)}
            />
          </div>
          <div
            className="rule"
            style={{ visibility: idFocus ? "visible" : "hidden" }}
          >
            아이디는 이메일을 사용하세요.
          </div>
          <div className="box">
            <Password width="20px" height="20px" />
            <input
              type={showPw ? "text" : "password"}
              id="pw"
              placeholder="비밀번호"
              minLength="8"
              maxLength="16"
              onChange={inputHandler}
              onFocus={() => setPwFocus(true)}
              onBlur={() => setPwFocus(false)}
            />
            <button type="button" onClick={pwHandler} className="pwBtn">
              {showPw ? (
                <Eye width="20px" height="20px" />
              ) : (
                <EyeSlash width="20px" height="20px" />
              )}
            </button>
          </div>
          <div
            className="rule"
            style={{ visibility: pwFocus ? "visible" : "hidden" }}
          >
            8~16자 영문 대 소문자, 숫자를 사용하세요.
          </div>
          <div className="box">
            <PasswordCheck width="20px" height="20px" />
            <input
              type={showPw ? "text" : "password"}
              id="pwCheck"
              placeholder="비밀번호 확인"
              minLength="8"
              maxLength="16"
              onChange={inputHandler}
              onFocus={() => setPwFocus(true)}
              onBlur={() => setPwFocus(false)}
            />
            <button type="button" onClick={pwHandler} className="pwBtn">
              {showPw ? (
                <Eye width="20px" height="20px" />
              ) : (
                <EyeSlash width="20px" height="20px" />
              )}
            </button>
          </div>
          <div
            className="rule"
            style={{ visibility: pwFocus ? "visible" : "hidden" }}
          >
            8~16자 영문 대 소문자, 숫자를 사용하세요.
          </div>
        </div>
        <button type="submit" disabled={disabled} className="submitBtn">
          {!disabled && "회원가입"}
          {disabled && <div className="spinner" />}
        </button>
      </form>
      <nav>
        <button type="button" className="moveBtn" onClick={() => navigate("/")}>
          <span className="move main">메인 페이지</span>
        </button>
        <button
          type="button"
          className="moveBtn"
          onClick={() => navigate("/login")}
        >
          <span className="move">로그인</span>
        </button>
      </nav>
      <S.Footer>
        {errorMessage && <li className="error">{errorMessage}</li>}
      </S.Footer>
    </S.EntryWrapper>
  );
}

export default Signup;
