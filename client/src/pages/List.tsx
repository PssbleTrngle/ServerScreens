import React, { useState } from 'react';
import API from '../api/Api';
import { useApi, useApiList } from '../api/Hooks';
import { IServer } from '../api/Models';

const List = () => {
    const [servers] = useApiList<IServer>('server');

    return <ul className='servers'>
        
    </ul>
}

export default List;