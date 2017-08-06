#!/bin/sh
# http://commons.wikimedia.org/wiki/User:XRay

cd $(dirname "$0")
cd ..

mkdir -p data/img
curl "https://upload.wikimedia.org/wikipedia/commons/c/c9/Flumserberg_%28Schweiz%29_--_2011_--_7.jpg" > data/img/cow.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/1/13/L%C3%BCdinghausen%2C_Burg_Wolfsberg_--_2014_--_1743.jpg" > data/img/house.jpg

curl "https://upload.wikimedia.org/wikipedia/commons/a/a3/Amboy_%28California%2C_USA%29_--_2012_--_4.jpg" > data/img/1.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/7/7a/Amboy_%28California%2C_USA%29%2C_Hist._Route_66_--_2012_--_1.jpg" > data/img/2.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/0/0c/Buldern%2C_Schloss_Buldern_--_2.jpg" > data/img/3.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/d/d8/D%C3%BClmen%2C_Haus_Osthoff_--_2012_--_2-2.jpg" > data/img/4.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/3/34/D%C3%BClmen%2C_Naturschutzgebiet_-Am_Enteborn-_--_2014_--_0202.jpg" > data/img/5.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/0/0c/D%C3%BClmen%2C_Nonnenturm_--_2012_--_1.jpg" > data/img/6.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/a/a6/D%C3%BClmen%2C_Umland%2C_Sonnenaufgang_--_2012_--_8.jpg" > data/img/7.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/c/cd/D%C3%BClmen%2C_Umland%2C_Sonnenaufgang_--_2012_--_9.jpg" > data/img/8.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/a/a1/Hiddingsel%2C_St.-Johannes-Nepomuk-Kapelle_--_2014_--_2990.jpg" > data/img/9.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/7/7a/Hoover_Dam%2C_Nevada_%28Arizona-Nevada%2C_USA%29_--_2012_--_14.jpg" > data/img/11.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/5/58/Kirchspiel%2C_R%C3%B6dder%2C_M%C3%A4usescheune_--_2014_--_2919.jpg" > data/img/12.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/f/f9/Kirchspiel%2C_R%C3%B6dder%2C_M%C3%A4usescheune_--_2014_--_2944.jpg" > data/img/13.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/c/c8/Las_Vegas_%28Nevada%2C_USA%29%2C_The_Strip_--_2012_--_19.jpg" > data/img/14.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/0/09/Los_Angeles_%28California%2C_USA%29%2C_South_Olive_Street_--_2012_--_7.jpg" > data/img/15.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/3/3d/L%C3%BCdinghausen%2C_Burg_L%C3%BCdinghausen_--_2014_--_5502.jpg" > data/img/16.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/1/1a/Merfeld%2C_Wildpferdefang_--_2014_--_0639.jpg" > data/img/17.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/4/48/M%C3%BCnster%2C_Schloss_--_2014_--_6771.jpg" > data/img/18.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/f/f8/M%C3%BCnster%2C_LVM%2C_-Villa_Kunterbunt-_--_2013_--_1-2.jpg" > data/img/21.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/7/76/M%C3%BCnster%2C_Westdeutsche_Lotterie_--_2013_--_1-4.jpg" > data/img/22.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/e/e4/M%C3%BCnster%2C_WestLotto_--_2013_--_1-3.jpg" > data/img/23.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/7/72/Paris%2C_Notre_Dame_--_2014_--_1458.jpg" > data/img/24.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/0/02/Rome_%28Italy%29%2C_Piazza_della_Rotonda%2C_Hub_of_a_Coach_--_2013_--_10.jpg" > data/img/25.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/e/e1/Senden%2C_Dortmund-Ems-Kanal_--_2014_--_2991.jpg" > data/img/26.jpg

curl "https://upload.wikimedia.org/wikipedia/commons/6/6a/R%C3%BCgen%2C_Beach_at_Sellin_--_2009_--_1.jpg" > data/img/a1.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/7/74/Juist%2C_Watt_--_2014_--_3546.jpg" > data/img/a2.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/a/a4/M%C3%BCnster%2C_LVM-Versicherung_--_2014_--_3276.jpg" > data/img/a3.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/a/ad/D%C3%BClmen%2C_Viktorkirmes_auf_dem_Overbergplatz_--_2014_--_3738.jpg" > data/img/a4.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/3/33/M%C3%BCnster%2C_Park_Sentmaring_--_2014_--_3976.jpg" > data/img/a5.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/9/99/Hiddingsel%2C_St.-Johannes-Nepomuk-Kapelle_--_2014_--_2985.jpg" > data/img/a6.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/f/fc/L%C3%BCdinghausen%2C_Burg_Vischering_--_2014_--_3024.jpg" > data/img/a7.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/3/3b/Karlsruhe%2C_Hochdruckreaktor_zur_Ammoniak-Synthese_--_2013_--_5283.jpg" > data/img/a8.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/f/fe/San_Diego_%28California%2C_USA%29%2C_Point_Loma%2C_Historic_Lighthouse_--_2012_--_5592.jpg" > data/img/a9.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/b/bd/K%C3%B6ln%2C_Hohe_Domkirche_St._Petrus_--_2014_--_1796.jpg" > data/img/a11.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/e/ed/Winterswijk_%28NL%29%2C_Berenschot%27s_Watermolen_--_2014_--_3118.jpg" > data/img/a12.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/7/7f/Karlsruhe%2C_Plastik_-Traum_IV-_--_2013_--_5268.jpg" > data/img/a13.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/4/4c/San_Diego_%28California%2C_USA%29%2C_Point_Loma%2C_Historic_Lighthouse_--_2012_--_5589.jpg" > data/img/a14.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/8/82/K%C3%B6ln%2C_Hohe_Domkirche_St._Petrus_--_2014_--_1797.jpg" > data/img/a15.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/b/b3/Karlsruhe%2C_Studentenwohnheim_--_2013_--_5245.jpg" > data/img/a16.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/6/6d/Karlsruhe%2C_Trib%C3%BCnengeb%C3%A4ude_--_2013_--_5285.jpg" > data/img/a17.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/8/88/Juist%2C_Dorf_--_2014_--_3526.jpg" > data/img/a18.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/0/08/Winterswijk_%28NL%29%2C_Berenschot%27s_Watermolen_--_2014_--_3172.jpg" > data/img/a19.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/a/a5/Recklinghausen%2C_Rathaus_--_2013_--_4934.jpg" > data/img/a20.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/e/e9/K%C3%B6ln%2C_Reiterstandbild_-Wilhelm_II.-_--_2014_--_1917.jpg" > data/img/a21.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/b/b5/Karlsruhe%2C_Victoriapensionat_--_2013_--_5246.jpg" > data/img/a22.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/7/7e/Juist%2C_ehem._Bahnhof_--_2014_--_3530.jpg" > data/img/a23.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/9/9b/Juist%2C_Liebesschl%C3%B6sser_%28am_Seezeichen%29_--_2014_--_3555.jpg" > data/img/a24.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/9/99/Recklinghausen%2C_St.-Peter-Kirche_--_2013_--_4918.jpg" > data/img/a25.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/c/c0/San_Diego_%28California%2C_USA%29%2C_Old_Town_--_2012_--_5550.jpg" > data/img/a26.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/9/98/Vatican_City_%28VA%29%2C_Petersplatz_--_2013_--_3855.jpg" > data/img/a27.jpg
curl "https://upload.wikimedia.org/wikipedia/commons/3/33/K%C3%B6ln%2C_Reiterstandbild_-Wilhelm_II.-_--_2014_--_1802.jpg" > data/img/a28.jpg

# curl "" > data/img/xxx.jpg
