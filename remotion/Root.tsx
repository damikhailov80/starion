import { Composition } from 'remotion';
import { MysticVideo } from '../app/components/MysticVideo';
import { defaultVideoConfig } from '../app/config/videoConfig';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MysticVideo"
        component={MysticVideo}
        durationInFrames={465}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultVideoConfig}
      />
    </>
  );
};
