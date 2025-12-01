import { createFImage } from '@/editor/objects/image';
import { useContext } from 'react';
import ImageSelector from '@/halas/components/ImageSelector';
import { GlobalStateContext } from '@/context';
import { useTranslation } from '@/i18n/utils';

export default function ImagePanel () {
  const { editor } = useContext(GlobalStateContext);
  const { t } = useTranslation();

  const addImage = async (url) => {
    await createFImage({
      imageSource: url,
      canvas: editor.canvas
    });
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 16 }}>
        {t('panel.image.title')}
      </div>
      <ImageSelector onChange={addImage} />
    </div>
  )
}