module.exports = function (engine, scenario, vp) {
  engine.evaluate(function () {
    // Your web-app is now loaded. Edit here to simulate user interactions or other state changes in the browser window context.

    page.evaluate(async () => {
      document.querySelectorAll('[loading="lazy"]').forEach((elem) => {
        elem.loading = 'eager';
      });

      console.log('ddd');

      await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 200;
          var timer = setInterval(() => {
            var scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
    
            if(totalHeight >= scrollHeight){
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
      
      await page.waitFor(5000);

    });
  });

  

};
