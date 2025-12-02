import { Flex } from 'antd';
import LocalImagePanel from './LocalImageSelector';
import RemoteImagePanel from './RemoteImageSelector';

export default function ImageSelector(props) {
  const { onChange, ...rest } = props;

  return (
    <Flex gap={16} vertical>
      <LocalImagePanel {...rest} onChange={onChange} />
      <RemoteImagePanel {...rest} onChange={onChange} />
    </Flex>
  );
}