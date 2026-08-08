import { useNavigate } from 'react-router-dom';
import CoinPrice from '../components/CoinPrice';

export default function CryptoPage() {
  const navigate = useNavigate();
  return <CoinPrice onOpenDetail={(item) => navigate(`/detail/crypto/${item.id}`, { state: { item } })} />;
}
