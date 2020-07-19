import React from 'react';
import { useApi } from '../api/Hooks';
import { IUser } from '../api/Models';

const UserPanel = () => {
    const [user] = useApi<IUser>('user');
    if (!user) return <p className='empty-info'>You are not logged in</p>
    return <h1 className='center'>Welcome {user.username}!</h1>
}

export default UserPanel;