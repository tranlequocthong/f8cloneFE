import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Image } from 'react-bootstrap';
import styles from './Auth.module.scss';
import f8Logo from '../../asset/images/f8_icon.png';
import { signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AuthWithPhoneNumberForm from '../../components/auth/forms/AuthWithPhoneNumberForm';
import AuthWithEmailAndPasswordForm from '../../components/auth/forms/AuthWithEmailAndPasswordForm';
import { login } from '../../actions/userAction';
import SignInButtonContainer from '../../components/auth/buttons/SignInButtonContainer';
import { apiURL } from '../../context/constants';
import Cookies from 'js-cookie';

const Auth = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLogin, setIsLogin] = useState(true);
  const [loginOption, setLoginOption] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [inValid, setInValid] = useState(false);

  const dispatchAndNavigate = (payload) => {
    dispatch(login(payload));
    navigate('/');
  };

  const handleIsLogin = () => {
    setIsLogin((prev) => !prev);
    setLoginOption('');
  };

  const loginWithProvider = async (provider) => {
    try {
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      const apiRes = await fetch(`${apiURL}/login/provider`, {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const apiData = await apiRes.json();

      if (apiData.hasUserCreatedAlready) {
        Cookies.set('token', apiData.accessToken, { expires: 365 });
        return dispatchAndNavigate({
          ...apiData.userCreated,
          accessToken: apiData.accessToken,
        });
      }

      console.log('CREATE NEW ACCOUNT WITH PROVIDER!');
      const newRes = await fetch(`${apiURL}/login/provider`, {
        method: 'POST',
        body: JSON.stringify({
          fullName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          provider: user.providerData[0].providerId,
          activated: true,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const newData = await newRes.json();
      Cookies.set('token', newData.accessToken, { expires: 365 });
      console.log(newData);
      dispatchAndNavigate({
        ...newData.user,
        accessToken: newData.accessToken,
      });
    } catch (error) {
      const isUsedEmailForOtherAuthProvider =
        error.code === 'auth/account-exists-with-different-credential';
      isUsedEmailForOtherAuthProvider && setInValid(true);
    }
  };

  const switchPhoneAndEmail = (option) => setLoginOption(option);

  let isShowAuthProviderOption;
  if (loginOption === '') isShowAuthProviderOption = true;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            {!isShowAuthProviderOption && (
              <Link
                to="/login"
                onClick={() => {
                  forgotPassword
                    ? setForgotPassword(false)
                    : switchPhoneAndEmail('');
                }}
                className={styles.backButton}
              >
                <i className="fa-solid fa-chevron-left"></i>
              </Link>
            )}
            <Link to="/">
              <Image src={f8Logo} />
            </Link>
            {!forgotPassword && (
              <h3>{isLogin ? '????ng nh???p v??o' : '????ng k?? t??i kho???n'} F8</h3>
            )}
            {forgotPassword && <h3>L???y l???i m???t kh???u</h3>}
          </div>
          <div className={styles.body}>
            {isShowAuthProviderOption && (
              <SignInButtonContainer
                switchPhoneAndEmail={switchPhoneAndEmail}
                loginWithProvider={loginWithProvider}
              />
            )}
            {loginOption === 'phone' && (
              <AuthWithPhoneNumberForm
                dispatchAndNavigate={dispatchAndNavigate}
                switchPhoneAndEmail={switchPhoneAndEmail}
                isLogin={isLogin}
              />
            )}
            {loginOption === 'email' && (
              <AuthWithEmailAndPasswordForm
                loginOption={loginOption}
                switchPhoneAndEmail={switchPhoneAndEmail}
                isLogin={isLogin}
                handleIsLogin={handleIsLogin}
                forgotPassword={forgotPassword}
                setForgotPassword={setForgotPassword}
                dispatchAndNavigate={dispatchAndNavigate}
              />
            )}
            {inValid && isShowAuthProviderOption && (
              <p className={styles.validate}>
                Email ???? ???????c s??? d???ng b???i m???t ph????ng th???c ????ng nh???p kh??c.
              </p>
            )}
            {!forgotPassword && (
              <div className={styles.noAccount}>
                <p>
                  {isLogin && (
                    <>
                      B???n ch??a c?? t??i kho???n?{' '}
                      <Link to="/register" onClick={handleIsLogin}>
                        ????ng k??
                      </Link>
                    </>
                  )}
                  {!isLogin && (
                    <>
                      B???n ???? c?? t??i kho???n?{' '}
                      <Link to="/login" onClick={handleIsLogin}>
                        ????ng nh???p
                      </Link>
                    </>
                  )}
                </p>
              </div>
            )}
            {loginOption === 'email' && isLogin && !forgotPassword && (
              <p
                className={styles.forgotPassword}
                onClick={() => setForgotPassword(true)}
              >
                Qu??n m???t kh???u?
              </p>
            )}
          </div>
        </div>
        <div className={styles.about}>
          <Link to="about-us">Gi???i thi???u v??? F8</Link>
          <span>|</span>
          <Link to="about-us">F8 tr??n Youtube</Link>
          <span>|</span>
          <Link to="about-us">F8 tr??n Facebook</Link>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Auth;
