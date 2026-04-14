 export const Assets = {
    BACKGROUND: './src/assets/backgroundColorForest.png',
    SPRITE_SHEET: './src/assets/spritesheet_jumper.png',
    SPRITE_SHEET_XML: './src/assets/spritesheet_jumper.xml'
};
export let loadedAssets = {}; // put successfully loaded images

 function loadImage(src){
     return new Promise((resolve, reject) =>{
         const img = new Image();
         img.addEventListener('load', () => {
             console.log(`Image loaded successfully: ${src}`);//delete later
             resolve(img);
         })
         img.addEventListener('error', () => {
             const error = new Error(`Image loaded failed: ${src}`);
             console.error(`Image loaded failed: ${src}`, error);
             reject(error)
         })
         img.src = src;
     })
 }

 // transfer xmlString to json Object
 function parseAtlasXML(xmlString) {
     const parser = new DOMParser();
     const xmlDoc = parser.parseFromString(xmlString, "text/xml");
     const subTextures = xmlDoc.getElementsByTagName("SubTexture");
     const atlas = {};
     for (let subTexture of subTextures) {
         const name = subTexture.getAttribute("name");
         atlas[name] = {
             x: parseInt(subTexture.getAttribute("x")),
             y: parseInt(subTexture.getAttribute("y")),
             width: parseInt(subTexture.getAttribute("width")),
             height: parseInt(subTexture.getAttribute("height"))
         };
     }
     return atlas;
 }

 export async function initAssets(){
     try {
         const [bgImg, spriteSheet, xmlString] = await Promise.all([
             loadImage(Assets.BACKGROUND),
             loadImage(Assets.SPRITE_SHEET),
             loadAtlas(Assets.SPRITE_SHEET_XML)
         ])
         loadedAssets.bgImg = bgImg;
         loadedAssets.spriteSheet = spriteSheet;
         loadedAssets.atlas = parseAtlasXML(xmlString);
         console.log(`all images and xml files loaded successfully, ready to start game!`);
     } catch (error) {
         console.error(`game initialize failed:`, error);
         alert(`please check image and xml file paths.`)
     }
 }

 async function loadAtlas(src) {
     return fetch(src).then(response => {
         if (!response.ok) throw new Error(`Failed to load: ${src}`);
         return response.text();
     });
 }