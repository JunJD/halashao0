import { Layout } from 'antd';
import Toolbar from './Toolbar';
import Export from './Export';
import Logo from './Logo';
import BaseInfo from './BaseInfo';
import { CenterV } from '@/fabritor/components/Center';

const { Header} = Layout;

const headerStyle: React.CSSProperties = {
  padding: 0,
  height: 56,
  backgroundColor: '#fff',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  zIndex: 100,
  position: 'relative'
};

export default function () {
  return (
    <Header style={headerStyle}>
      <Logo />
      <CenterV
        justify="space-between"
        style={{ flex: 1 }}
      >
        <BaseInfo />
        <Toolbar />
      </CenterV>
      <Export />
    </Header>
  )
}