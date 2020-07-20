import React, { useState } from 'react';
import API from '../api/Api';
import { useHistory } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>();
    const { push } = useHistory();

    return <div className='login'>
        {error ? <p className='error'>{error}</p> : <p />}
        <form onSubmit={e => {
            e.preventDefault();
            setError(undefined);
            API.login(username, password)
                .then(b => {
                    if (b) push('/')
                }).catch(e => setError(e.message));
        }}>

            <input
                className='big'
                type='text'
                placeholder='Username'
                value={username}
                onChange={e => setUsername(e.target.value)}
            />

            <input
                className='big'
                type='password'
                placeholder='Password'
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <input type='submit' value='Login' />

        </form>
    </div>
}

export default Login;