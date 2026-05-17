import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import styles from './SignupPage.module.css';

const steps = [
  { id: 1, label: '기본 정보' },
  { id: 2, label: '인증' },
  { id: 3, label: '약관 동의' },
];

const defaultForm = {
  name: '',
  nickname: '',
  email: '',
  password: '',
  passwordConfirm: '',
  phone: '',
};

const termItems = [
  { id: 'service', label: '[필수] 이용약관 동의', required: true },
  { id: 'privacy', label: '[필수] 개인정보 수집 및 이용 동의', required: true },
  { id: 'marketing', label: '[선택] 마케팅 정보 수신 동의', required: false },
];

function BrandHeader({ eyebrow }) {
  return (
    <header className={styles.brandHeader}>
      <div className={styles.brand}>
        <img className={styles.brandLogo} src="/MoodCast-logo.svg" alt="" aria-hidden="true" />
        <strong>MoodCast</strong>
      </div>
      <h1>회원가입</h1>
      <p>{eyebrow}</p>
    </header>
  );
}

function AuthLayout({ children }) {
  return <main className={styles.page}>{children}</main>;
}

function SignupStepper({ currentStep }) {
  return (
    <ol className={styles.stepper} aria-label="회원가입 단계">
      {steps.map((step) => {
        const isDone = currentStep > step.id;
        const isActive = currentStep === step.id;

        return (
          <li key={step.id} className={`${styles.stepItem} ${isActive ? styles.stepActive : ''} ${isDone ? styles.stepDone : ''}`}>
            <span className={styles.stepDot}>{isDone ? <CheckRoundedIcon fontSize="inherit" /> : step.id}</span>
            <span className={styles.stepText}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, required = false, action, children }) {
  return (
    <label className={styles.field}>
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      <div className={action ? styles.inputAction : undefined}>
        {children}
        {action}
      </div>
    </label>
  );
}

function SocialSignupButtons({ onSocialSignup }) {
  return (
    <div className={styles.socialArea}>
      <div className={styles.divider}>
        <span />
        <em>또는 소셜로 간편가입</em>
        <span />
      </div>
      <div className={styles.socialIconRow}>
        <button type="button" className={`${styles.socialButton} ${styles.kakao}`} onClick={() => onSocialSignup('kakao')} aria-label="카카오로 간편가입">
          <ChatBubbleRoundedIcon fontSize="small" />
        </button>
        <button type="button" className={styles.socialButton} onClick={() => onSocialSignup('google')} aria-label="Google로 간편가입">
          <span className={styles.googleMark}>G</span>
        </button>
        <button type="button" className={`${styles.socialButton} ${styles.naver}`} onClick={() => onSocialSignup('naver')} aria-label="네이버로 간편가입">
          <b>N</b>
        </button>
      </div>
    </div>
  );
}

function BasicInfoStep({ form, updateForm, onNext, onSocialSignup }) {
  return (
    <>
      <div className={styles.formFields}>
        <div className={styles.fieldPair}>
          <Field label="이름" required>
            <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="실명을 입력하세요" />
          </Field>

          <Field label="닉네임" required={false}>
            <input value={form.nickname} onChange={(event) => updateForm('nickname', event.target.value)} placeholder="닉네임 입력" />
          </Field>
        </div>

        <Field
          label="이메일"
          required
          action={
            <button type="button" className={styles.ghostButton}>
              인증 요청
            </button>
          }
        >
          <input value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="이메일 주소를 입력하세요" />
        </Field>

        <div className={styles.fieldPair}>
          <Field label="비밀번호" required>
            <input
              value={form.password}
              onChange={(event) => updateForm('password', event.target.value)}
              type="password"
              placeholder="8자 이상"
            />
          </Field>

          <Field label="비밀번호 확인" required>
            <input value={form.passwordConfirm} onChange={(event) => updateForm('passwordConfirm', event.target.value)} type="password" placeholder="다시 입력" />
          </Field>
        </div>
      </div>

      <div className={styles.bottomGroup}>
        <button type="button" className={styles.primaryButton} onClick={onNext}>
          다음 단계
        </button>

        <SocialSignupButtons onSocialSignup={onSocialSignup} />

        <p className={styles.switchText}>
          이미 계정이 있으신가요? <a href="/auth/login">로그인</a>
        </p>
      </div>
    </>
  );
}

function VerificationCode() {
  return (
    <div className={styles.codeGrid} aria-label="인증번호 6자리 입력 예시">
      {['8', '2', '4', '', '', ''].map((value, index) => (
        <input key={`${index}-${value}`} value={value} readOnly aria-label={`인증번호 ${index + 1}번째 자리`} />
      ))}
    </div>
  );
}

function VerifyStep({ form, updateForm, onPrev, onNext }) {
  return (
    <>
      <div className={styles.successNotice}>
        <CheckRoundedIcon fontSize="small" />
        <div>
          <strong>이메일 인증 완료</strong>
          <span>{form.email || 'user@example.com'}</span>
        </div>
      </div>

      <Field
        label="휴대폰 번호"
        required
        action={
          <button type="button" className={styles.ghostButton}>
            인증번호 발송
          </button>
        }
      >
        <input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="'-' 없이 번호만 입력" />
      </Field>

      <Field label="인증번호 입력" required>
        <div className={styles.codeRow}>
          <VerificationCode />
          <time>02:47</time>
        </div>
      </Field>

      <p className={styles.helperText}>인증번호가 발송되었습니다. 3분 내에 입력해주세요.</p>

      <div className={styles.actions}>
        <button type="button" className={styles.outlineButton} onClick={onPrev}>
          이전
        </button>
        <button type="button" className={styles.primaryButton} onClick={onNext}>
          다음 단계
        </button>
      </div>
    </>
  );
}

function TermsStep({ terms, toggleTerm, onPrev, onComplete }) {
  const allChecked = termItems.every((item) => terms[item.id]);

  return (
    <>
      <div className={styles.badgeRow}>
        <span>
          <CheckRoundedIcon fontSize="small" />
          이메일 인증 완료
        </span>
        <span>
          <CheckRoundedIcon fontSize="small" />
          휴대폰 인증 완료
        </span>
      </div>

      <section className={styles.termsBox} aria-label="약관 동의">
        <label className={styles.termAll}>
          <input type="checkbox" checked={allChecked} onChange={() => toggleTerm('all')} />
          <span>전체 동의</span>
        </label>

        {termItems.map((item) => (
          <label key={item.id} className={styles.termItem}>
            <input type="checkbox" checked={terms[item.id]} onChange={() => toggleTerm(item.id)} />
            <span>{item.label}</span>
            <button type="button" aria-label={`${item.label} 내용 보기`}>
              내용 보기
              <ChevronRightRoundedIcon fontSize="small" />
            </button>
          </label>
        ))}
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.outlineButton} onClick={onPrev}>
          이전
        </button>
        <button type="button" className={styles.primaryButton} onClick={onComplete}>
          가입 완료
        </button>
      </div>
    </>
  );
}

function CompleteView({ form, onGoHome, onGoSetup }) {
  const summary = useMemo(
    () => ({
      name: form.name || '홍길동',
      nickname: form.nickname || 'moody_hong',
      email: form.email || 'user@example.com',
    }),
    [form.email, form.name, form.nickname],
  );

  return (
    <main className={styles.page}>
      <section className={`${styles.authCard} ${styles.completeCard}`}>
        <div className={styles.partyIcon}>
          <CheckRoundedIcon fontSize="large" />
        </div>
        <h1>회원가입 완료!</h1>
        <p>MoodCast에 오신 것을 환영합니다. 지금 바로 당신의 무드를 공유해보세요.</p>

        <dl className={styles.summaryBox}>
          <div>
            <dt>이름</dt>
            <dd>{summary.name}</dd>
          </div>
          <div>
            <dt>닉네임</dt>
            <dd>{summary.nickname}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{summary.email}</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button type="button" className={styles.outlineButton} onClick={onGoHome}>
            홈으로
          </button>
          <button type="button" className={styles.primaryButton} onClick={onGoSetup}>
            무드 선택하러 가기
          </button>
        </div>
      </section>
    </main>
  );
}

function SocialExtraView({ provider, form, updateForm, onBack, onComplete }) {
  const providerLabel = {
    kakao: '카카오',
    naver: '네이버',
    google: 'Google',
  }[provider];

  return (
    <AuthLayout>
      <section className={styles.authCard}>
        <BrandHeader eyebrow={`${providerLabel} 계정으로 가입을 진행합니다. 추가 정보를 입력해주세요.`} />

        <div className={styles.form}>
          <div className={styles.socialNotice}>
            <ChatBubbleRoundedIcon fontSize="small" />
            <div>
              <strong>{providerLabel} 계정 연동</strong>
              <span>{provider === 'kakao' ? 'kakao_user@daum.net' : 'social_user@example.com'}</span>
            </div>
            <em>연동 완료</em>
          </div>

          <Field label="이메일" required>
            <input value={form.email || 'kakao_user@daum.net'} onChange={(event) => updateForm('email', event.target.value)} />
          </Field>
          <div className={styles.fieldPair}>
            <Field label="이름" required>
              <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="이름 입력" />
            </Field>
            <Field label="닉네임" required={false}>
              <input value={form.nickname} onChange={(event) => updateForm('nickname', event.target.value)} placeholder="닉네임 입력" />
            </Field>
          </div>
          <Field
            label="휴대폰 번호"
            required
            action={
              <button type="button" className={styles.ghostButton}>
                인증번호 발송
              </button>
            }
          >
            <input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="'-' 없이 번호만 입력" />
          </Field>

          <section className={styles.termsBox} aria-label="간편가입 약관 동의">
            {['전체 동의', '[필수] 이용약관 동의', '[필수] 개인정보 수집 및 이용 동의', '[선택] 마케팅 정보 수신 동의'].map((label) => (
              <label key={label} className={styles.termItem}>
                <input type="checkbox" defaultChecked={label === '전체 동의'} />
                <span>{label}</span>
              </label>
            ))}
          </section>

          <div className={styles.actions}>
            <button type="button" className={styles.outlineButton} onClick={onBack}>
              이전
            </button>
            <button type="button" className={styles.primaryButton} onClick={onComplete}>
              가입 완료
            </button>
          </div>
        </div>
      </section>
    </AuthLayout>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(defaultForm);
  const [mode, setMode] = useState('signup');
  const [socialProvider, setSocialProvider] = useState('kakao');
  const [terms, setTerms] = useState({
    service: false,
    privacy: false,
    marketing: false,
  });

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTerm = (key) => {
    if (key === 'all') {
      const shouldCheck = !termItems.every((item) => terms[item.id]);
      setTerms({
        service: shouldCheck,
        privacy: shouldCheck,
        marketing: shouldCheck,
      });
      return;
    }

    setTerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSocialSignup = (provider) => {
    setSocialProvider(provider);
    setMode('social');
  };

  if (mode === 'complete') {
    return <CompleteView form={form} onGoHome={() => navigate('/app/feed')} onGoSetup={() => navigate('/auth/setup')} />;
  }

  if (mode === 'social') {
    return (
      <SocialExtraView
        provider={socialProvider}
        form={form}
        updateForm={updateForm}
        onBack={() => setMode('signup')}
        onComplete={() => setMode('complete')}
      />
    );
  }

  return (
    <AuthLayout>
      <section className={styles.authCard}>
        <BrandHeader eyebrow="MoodCast에서 당신의 감정을 공유하세요" />
        <section className={styles.progressGroup} aria-label="회원가입 진행 상황">
          <SignupStepper currentStep={step} />
        </section>

        <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
          {step === 1 ? <BasicInfoStep form={form} updateForm={updateForm} onNext={() => setStep(2)} onSocialSignup={handleSocialSignup} /> : null}
          {step === 2 ? <VerifyStep form={form} updateForm={updateForm} onPrev={() => setStep(1)} onNext={() => setStep(3)} /> : null}
          {step === 3 ? <TermsStep terms={terms} toggleTerm={toggleTerm} onPrev={() => setStep(2)} onComplete={() => setMode('complete')} /> : null}
        </form>
      </section>
    </AuthLayout>
  );
}
