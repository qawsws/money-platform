import { useNavigate } from 'react-router-dom';
import CommunityPosts from '../components/CommunityPosts';

export default function CommunityPage() {
  const navigate = useNavigate();
  return <CommunityPosts showComposer onOpenDetail={(item) => navigate(`/detail/community/${item.id}`, { state: { item } })} />;
}
