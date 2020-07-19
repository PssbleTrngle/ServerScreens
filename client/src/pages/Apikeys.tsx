import React from 'react';
import { useLoadingList } from '../api/Hooks';
import { IApiKey } from '../api/Models';

const Apikeys = () => {
    const keys = useLoadingList<IApiKey>('apikeys', keys =>
        <>{keys.map(({ id, purpose }) =>
            <li key={id}>{purpose}</li>
        )}</>
    );

    return <ul>{keys}</ul>;
}

export default Apikeys;