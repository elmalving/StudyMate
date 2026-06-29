import React, { useState } from 'react';
import httpClient from '../httpClient';
import { Link } from 'react-router-dom';
import '../css/register.css';

const Register = () => {
    const [firstName, setfirstName] = useState('');
    const [lastName, setlastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [degree, setDegree] = useState('');
    const [termsChecked, setTerms] = useState(false);
    const [errors, setErrors] = useState({});

    const signUpUser = async () => {
        const newErrors = {};
        if (!firstName) newErrors.firstName = 'First Name is required';
        if (!lastName) newErrors.lastName = 'Last Name is required';
        if (!email) newErrors.email = 'Email is required';
        if (!password) newErrors.password = 'Password is required';
        if (!degree) newErrors.degree = 'Current Degree is required';
        if (!termsChecked) newErrors.termsChecked = 'You must agree to the Terms and conditions';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await httpClient.post('//localhost:5000/register', {
                email,
                password,
                firstName,
                lastName,
                degree,
            });

            window.location.href = '/';
        } catch (e) {
            if (e.response.status === 409) {
                alert(e.response.data.error);
            }
        }
    };

    return (
        <div className="register-page">
            <div className="content">
                <div className="studymate-container">
                    <div className="align-left">
                        <img src="./brand.svg" className="logo" />
                    </div>
                    <div className="align-right align-middle">
                        <Link className="font-gradient" to={'/login'}>
                            Log In
                        </Link>
                    </div>
                </div>
                <div className="column-container">
                    <div className="login-content align-center">
                        <div className="row-gap">
                            <div className="login-welcome">
                                Welcome aboard! Let&apos;s start your educational
                                journey together.
                            </div>
                        </div>
                        <form className="login-form">
                            <div className="row-gap">
                                <div className="column-gap">
                                    <div className="column-container">
                                        <label
                                            className="column-label align-left"
                                            htmlFor="firstName"
                                        >
                                            First Name
                                        </label>
                                        <div className="input-container">
                                            <input
                                                id="firstName"
                                                placeholder="First Name"
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => {
                                                    setfirstName(e.target.value);
                                                    if (errors.firstName) {
                                                        setErrors((prev) => ({ ...prev, firstName: '' }));
                                                    }
                                                }}
                                                className="input input-placeholder"
                                                required
                                            />
                                        </div>
                                        {errors.firstName && (
                                            <span className="error-message">{errors.firstName}</span>
                                        )}
                                    </div>
                                    <div className="column-container">
                                        <label
                                            className="column-label align-left"
                                            htmlFor="lastName"
                                        >
                                            Last Name
                                        </label>
                                        <div className="input-container">
                                            <input
                                                id="lastName"
                                                placeholder="Last Name"
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => {
                                                    setlastName(e.target.value);
                                                    if (errors.lastName) {
                                                        setErrors((prev) => ({ ...prev, lastName: '' }));
                                                    }
                                                }}
                                                className="input input-placeholder"
                                                required
                                            />
                                        </div>
                                        {errors.lastName && (
                                            <span className="error-message">{errors.lastName}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="row-gap">
                                <div className="column-gap">
                                    <div className="column-container">
                                        <label
                                            className="column-label align-left"
                                            htmlFor="email"
                                        >
                                            Email
                                        </label>
                                        <div className="input-container">
                                            <input
                                                id="email"
                                                placeholder="Email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (errors.email) {
                                                        setErrors((prev) => ({ ...prev, email: '' }));
                                                    }
                                                }}
                                                className="input input-placeholder"
                                                required
                                            />
                                        </div>
                                        {errors.email && (
                                            <span className="error-message">{errors.email}</span>
                                        )}
                                    </div>
                                    <div className="column-container">
                                        <label
                                            className="column-label align-left"
                                            htmlFor="password"
                                        >
                                            Password
                                        </label>
                                        <div className="input-container">
                                            <input
                                                id="password"
                                                placeholder="Password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (errors.password) {
                                                        setErrors((prev) => ({ ...prev, password: '' }));
                                                    }
                                                }}
                                                className="input input-placeholder"
                                                required
                                            />
                                        </div>
                                        {errors.password && (
                                            <span className="error-message">{errors.password}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="row-gap">
                                <div className="column-container">
                                    <label
                                        className="column-label align-left"
                                        htmlFor="degree"
                                    >
                                        Current Degree
                                    </label>
                                    <div className="input-container">
                                        <select
                                            id="degree"
                                            value={degree}
                                            onChange={(e) => {
                                                setDegree(e.target.value);
                                                if (errors.degree) {
                                                    setErrors((prev) => ({ ...prev, degree: '' }));
                                                }
                                            }}
                                            className="select"
                                            required
                                        >
                                            <option
                                                defaultValue={''}
                                                disabled
                                                hidden
                                            ></option>
                                            <option value="Elementary">
                                                Elementary education
                                            </option>
                                            <option value="Upper">
                                                Upper secondary education
                                            </option>
                                            <option value="Tertiary">
                                                Tertiary or university education
                                            </option>
                                        </select>
                                    </div>
                                    {errors.degree && (
                                        <span className="error-message">{errors.degree}</span>
                                    )}
                                </div>
                            </div>
                            <div className="input-misc-container">
                                <div className="input-misc">
                                    <div className="remember-container">
                                        <input
                                            type="checkbox"
                                            id="remember-checkbox"
                                            onChange={() => {
                                                setTerms(!termsChecked);
                                                if (errors.termsChecked) {
                                                    setErrors((prev) => ({ ...prev, termsChecked: '' }));
                                                }
                                            }}
                                            checked={termsChecked}
                                            required
                                        />
                                        <label
                                            className="remember-label"
                                            htmlFor="remember-checkbox"
                                        >
                                            I agree with&nbsp;
                                            <a
                                                className="font-gradient"
                                                target="_blank"
                                                rel="noreferrer"
                                                href="https://github.com/elmalving/Hackathon-2023/blob/main/LICENSE"
                                            >
                                                Terms and conditions
                                            </a>
                                        </label>
                                    </div>
                                </div>
                                {errors.termsChecked && (
                                    <div className="error-message" style={{ marginTop: '8px' }}>
                                        {errors.termsChecked}
                                    </div>
                                )}
                            </div>
                            <button
                                className="submit-button submit-label"
                                type="button"
                                onClick={() => signUpUser()}
                            >
                                Create an account
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="bg-image illustration"></div>
        </div>
    );
};

export default Register;
