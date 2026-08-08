import { useNavigate } from 'react-router-dom';
import MarketIndex from '../components/MarketIndex';

export default function MarketPage() {
  const navigate = useNavigate();
  return <MarketIndex onOpenDetail={(item) => navigate(`/detail/market/${item.id}`, { state: { item } })} />;
}
