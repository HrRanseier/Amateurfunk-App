import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { MorseSegment } from "./morse";

export type MorseAudioHandle = {
  play: (freq: number, timeline: MorseSegment[]) => void;
  stop: () => void;
};

// Hidden WebView hosting a Web Audio oscillator. Generating a scheduled sine
// envelope gives sample-accurate morse timing and a clean sine tone without
// bundling audio files. Works on native (Android/iOS + Expo Go).
const HTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>
<script>
  var ctx=null, osc=null, gain=null;
  function notify(t){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(t); } }
  function stopMorse(){
    try{ if(osc){ osc.onended=null; osc.stop(); osc.disconnect(); } }catch(e){}
    try{ if(gain){ gain.disconnect(); } }catch(e){}
    try{ if(ctx){ ctx.close(); } }catch(e){}
    osc=null; gain=null; ctx=null;
  }
  function playMorse(freq, timeline){
    stopMorse();
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC){ return; }
    ctx = new AC();
    if(ctx.state === 'suspended' && ctx.resume){ ctx.resume(); }
    osc = ctx.createOscillator();
    gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain); gain.connect(ctx.destination);
    var t = ctx.currentTime + 0.06;
    var r = 0.006;
    for(var i=0;i<timeline.length;i++){
      var seg = timeline[i];
      var dur = seg.ms/1000;
      if(seg.on){
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + r);
        gain.gain.setValueAtTime(0.3, t + Math.max(dur - r, r));
        gain.gain.linearRampToValueAtTime(0, t + dur);
      }
      t += dur;
    }
    osc.start();
    osc.stop(t + 0.05);
    osc.onended = function(){ notify('ended'); };
    notify('playing');
  }
  window.playMorse = playMorse;
  window.stopMorse = stopMorse;
  true;
</script></body></html>`;

export const MorseAudio = forwardRef<MorseAudioHandle, { onEnded?: () => void }>(
  ({ onEnded }, ref) => {
    const webRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      play: (freq, timeline) => {
        const js = `window.playMorse(${freq}, ${JSON.stringify(timeline)}); true;`;
        webRef.current?.injectJavaScript(js);
      },
      stop: () => {
        webRef.current?.injectJavaScript(`window.stopMorse(); true;`);
      },
    }));

    // WebView audio is native-only; on web this renders nothing.
    if (Platform.OS === "web") return null;

    return (
      <View style={styles.hidden} pointerEvents="none">
        <WebView
          ref={webRef}
          source={{ html: HTML }}
          originWhitelist={["*"]}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          onMessage={(e) => {
            if (e.nativeEvent.data === "ended") onEnded?.();
          }}
        />
      </View>
    );
  },
);
MorseAudio.displayName = "MorseAudio";

const styles = StyleSheet.create({
  hidden: {
    width: 1,
    height: 1,
    position: "absolute",
    opacity: 0,
    top: -10,
    left: -10,
  },
});
