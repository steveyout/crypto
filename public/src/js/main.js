

/*----------------------------------------------------*/
/*	VIDEO POP PUP
/*----------------------------------------------------*/

    $('.video-modal').magnificPopup({
            type: 'iframe',

                iframe: {
                    patterns: {
                        youtube: {

                            index: 'youtube.com',
                            src: 'https://www.youtube.com/embed/Um63OQz3bjo'
                                }
                            }
                        }
        });

/* ---------------------------------------------
 Back top page scroll up
 --------------------------------------------- */


$.scrollUp({
    scrollText: '<i class="arrow_up"></i>',
    easingType: 'linear',
    scrollSpeed: 900,
    animation: 'fade'
});


/* ---------------------------------------------
 WoW plugin
 --------------------------------------------- */

new WOW().init({
    mobile: true,
});

/* ---------------------------------------------
 Smooth scroll
 --------------------------------------------- */

  $('a.section-scroll[href*="#"]:not([href="#"])').on('click', function (event) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
        || location.hostname == this.hostname) {

        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
        if (target.length) {
            // Only prevent default if animation is actually gonna happen
        event.preventDefault();
            $('html,body').animate({
                scrollTop: target.offset().top
            }, 750);
            return false;
        }
    }
});


(function($) {

  "use strict";

  var $particlsA = $("#particles");
  if ($particlsA.length) {
    $particlsA.particleground({
      minSpeedX: 0.6,
      minSpeedY: 0.6,
      dotColor: '#ffffff',
      lineColor: '#ffffff',
      density: 6000,
      particleRadius: 2, // curvedLines: true,
      parallaxMultiplier: 5.2,
      proximity: 0
    });
  }
})(jQuery);



$('.testimonial-caroussel').owlCarousel({
    responsiveClass: true,
    nav:false,
    dots:true,
    autoplay: true,
    autoplayTimeout: 4000,
    smartSpeed: 500,
    responsive: {
        0: {
            items: 1,
        },
        600: {
            items: 1

        },
        1200: {
            items: 1
        }
    }
});
