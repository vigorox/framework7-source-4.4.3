import $ from 'dom7';

function svgWheelCircles() {
  const total = 256;
  let circles = '';
  for (let i = total; i > 0; i -= 1) {
    const angle = i * Math.PI / (total / 2);
    const hue = 360 / total * i;
    circles += `<circle cx="${150 - Math.sin(angle) * 125}" cy="${150 - Math.cos(angle) * 125}" r="15" fill="hsl(${hue}, 100%, 50%)"></circle>`;
  }
  return circles;
}
export default {
  render() {
    return `
      <div class="color-picker-module color-picker-module-wheel">
        <div class="color-picker-wheel">
          <svg viewBox="0 0 300 300" width="300" height="300">${svgWheelCircles()}</svg>
          <div class="color-picker-wheel-handle"></div>
        </div>
      </div>
    `;
  },
  init(self) {
    const { app } = self;

    let isTouched;
    let isMoved;
    let touchStartX;
    let touchStartY;
    let touchCurrentX;
    let touchCurrentY;

    let wheelRect;
    let wheelIsTouched;
    let wheelHandleIsTouched;

    const constSaturation = 1.0;
    const constBrightness = 1.0;

    const { $el } = self;

    function setHueFromWheelCoords(x, y) {
      const wheelCenterX = wheelRect.left + wheelRect.width / 2;
      const wheelCenterY = wheelRect.top + wheelRect.height / 2;
      const angleRad = Math.atan2(y - wheelCenterY, x - wheelCenterX);
      let angleDeg = angleRad * 180 / Math.PI + 90;
      if (angleDeg < 0) angleDeg += 360;
      angleDeg = 360 - angleDeg;
      self.setValue({ hsb: [angleDeg, constSaturation, constBrightness] });
    }


    function handleTouchStart(e) {
      if (isMoved || isTouched) return;
      touchStartX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touchCurrentX = touchStartX;
      touchStartY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      touchCurrentY = touchStartY;
      const $targetEl = $(e.target);
      wheelHandleIsTouched = $targetEl.closest('.color-picker-wheel-handle').length > 0;
      wheelIsTouched = $targetEl.closest('circle').length > 0;
      if (wheelIsTouched) {
        wheelRect = $el.find('.color-picker-wheel')[0].getBoundingClientRect();
        setHueFromWheelCoords(touchStartX, touchStartY);
      }
    }
    function handleTouchMove(e) {
      if (!(wheelIsTouched || wheelHandleIsTouched)) return;
      touchCurrentX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      touchCurrentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      e.preventDefault();
      if (!isMoved) {
        // First move
        isMoved = true;
        if (wheelHandleIsTouched) {
          wheelRect = $el.find('.color-picker-wheel')[0].getBoundingClientRect();
        }
      }
      if (wheelIsTouched || wheelHandleIsTouched) {
        setHueFromWheelCoords(touchCurrentX, touchCurrentY);
      }
    }
    function handleTouchEnd() {
      isMoved = false;
      wheelIsTouched = false;
      wheelHandleIsTouched = false;
    }

    function handleResize() {
      self.modules.wheel.update(self);
    }

    const passiveListener = app.touchEvents.start === 'touchstart' && app.support.passiveListener ? { passive: true, capture: false } : false;

    self.$el.on(app.touchEvents.start, handleTouchStart, passiveListener);
    app.on('touchmove:active', handleTouchMove);
    app.on('touchend:passive', handleTouchEnd);
    app.on('resize', handleResize);

    self.destroyWheelEvents = function destroyWheelEvents() {
      self.$el.off(app.touchEvents.start, handleTouchStart, passiveListener);
      app.off('touchmove:active', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
      app.off('resize', handleResize);
    };
  },
  update(self) {
    const {
      value,
    } = self;

    const { hsl, hsb } = value;

    const wheelSize = self.$el.find('.color-picker-wheel')[0].offsetWidth;
    const wheelHalfSize = wheelSize / 2;
    const angleRad = value.hue * Math.PI / 180;
    const handleSize = wheelSize / 6;
    const handleHalfSize = handleSize / 2;
    const tX = wheelHalfSize - Math.sin(angleRad) * (wheelHalfSize - handleHalfSize) - handleHalfSize;
    const tY = wheelHalfSize - Math.cos(angleRad) * (wheelHalfSize - handleHalfSize) - handleHalfSize;
    self.$el.find('.color-picker-wheel-handle')
      .css('background-color', `hsl(${hsl[0]}, 100%, 50%)`)
      .transform(`translate(${tX}px, ${tY}px)`);
  },
  destroy(self) {
    if (self.destroyWheelEvents) self.destroyWheelEvents();
    delete self.destroyWheelEvents;
  },
};
