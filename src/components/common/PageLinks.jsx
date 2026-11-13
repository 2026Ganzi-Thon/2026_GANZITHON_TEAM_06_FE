import { Link } from 'react-router-dom';

const pages = [
    { to: '/', label: '온보딩' },
    { to: '/waiting-room', label: '대기실' },
    { to: '/collection', label: '털실' },
    { to: '/my-sheep', label: '마이 양' },
];

export default function PageLinks()
{
    return (
        <nav>
            {pages.map((page) => (
                <Link key={page.to} to={page.to}>{page.label}</Link>
            ))}
        </nav>
    );
}
