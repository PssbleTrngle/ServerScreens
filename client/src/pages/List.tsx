import React, { useEffect } from 'react';
import { useLoadingList, useSubmit } from '../api/Hooks';
import { IServer } from '../api/Models';
import API from '../api/Api';

const List = () => {
    return useLoadingList<IServer>('server', servers =>
        <ul className='servers'>
            {servers.map(s => <Server key={s.id} {...s} />)}
        </ul>
    );
}

const Server = (server: IServer) => {
    const { name, id, online, properties } = server;

    const port = properties?.["server-port"];
    const address = `somethingcatchy.net${port ? ':' + port : ''}`;

    return <li>
        <img src={`/api/server/${id}/icon`} alt='Server icon' />
        <h1>{name}</h1>
        <h2>{properties?.motd}</h2>
        <p className='address'>{online && address}</p>
        <p className='status'>
            <span>{online ? 'Online' : 'Offline'}</span>
            <img alt='Server status' src={require(`../assets/${online ? 'online' : 'offline'}.png`)} />
        </p>
        <Button {...server} />
    </li>
}

const Button = ({ permissions, id, online }: IServer) => {
    const action = online ? 'stop' : 'start';
    const allowed = !!permissions[action] || undefined;
    const { post, inProgress, error } = useSubmit(`server/${id}/${action}`)

    useEffect(() => {
        if (error) console.error(error);
    }, [error])

    return <button
        disabled={inProgress || !allowed}
        onClick={allowed && post}
        title={allowed ? `${action} the server` : 'Not allowed'}>
        <img src={require(`../assets/${action}.png`)} alt='action' />
    </button>
}

export default List;