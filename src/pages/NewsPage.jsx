import { useNavigate } from 'react-router-dom';
import NewsList from '../components/NewsList';

export default function NewsPage() {
  const navigate = useNavigate();
  return <NewsList onOpenDetail={(item) => navigate(`/detail/news/${item.id}`, { state: { item } })} />;
}
