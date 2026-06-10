import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * OSの「視差効果を減らす」設定を尊重するためのフック。
 * trueのとき、装飾的なアニメーションは停止または即時完了させること。
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
