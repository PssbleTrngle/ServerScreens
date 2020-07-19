import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Link } from 'react-router-dom';
import { IPage } from '../App';

const Navbar = ({ pages }: { pages: IPage[] }) => {
    return <nav>
        <ul>
            {pages.map(({ path, icon }) =>
                <li key={path}>
                    <Link to={path}>
                        <Icon icon={icon ?? faQuestionCircle} />
                    </Link>
                </li>
            )}
        </ul>
    </nav>
}

export default Navbar;