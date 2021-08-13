# Friendzone
The project aim at connecting families and friends’ bond closely, with sharing own location to each other, and contacting people instantly by text messages or video calls.</br>
Website link: https://friendzone.tw/</br>
Test account: test@gmail.com</br>
Test password: test</br>
Also can register your own account or use Google login.

## System Structure
![structre](https://user-images.githubusercontent.com/73774991/129360411-81ecdc07-16ad-4a3a-a021-8e50d1acae45.png)

## Database Structure (MySQL)
![database](https://user-images.githubusercontent.com/73774991/129360399-68d2c26d-f313-4bb5-b7f1-d25891ff94bb.png)

## Demo
* Location sharing: you can see friends’ current position if they allow, also the last update at the position.
![gif-01](https://user-images.githubusercontent.com/73774991/129359846-49ea8390-9f10-4100-9605-6ec3d9ca82b1.gif)
* Distance broadcasting: you can send message to many friends once without texting them one by one, just setting specific distance you want.
![gif-03](https://user-images.githubusercontent.com/73774991/129359902-aa008137-3c63-4fe3-bfd5-316c14d4ac9e.gif)
* Real-time message: you can send message to friends, if they are online they can immediately receive the notification and send you back!
![gif-02](https://user-images.githubusercontent.com/73774991/129359894-c1e72dc4-7ffe-4e6a-9f5f-83318fb362e6.gif)
![gif-05](https://user-images.githubusercontent.com/73774991/129360060-6039fbcb-9b51-4df8-9030-3aaa133a3dda.gif)
* Video call: you can call friends directly if you prefer communicating with voice and face.
![gif-04](https://user-images.githubusercontent.com/73774991/129360011-424578ae-970e-48a6-a44e-68f417efeec3.gif)

## Skill Used
* Use Node.js / Express.js as server framework
* Transmit real-time chat messages and notifications through Socket.IO
* Implement live video streaming with WebRTC
* Storage pictures and accelerate content delivery by AWS S3 and CloudFront 
* Improve MySQL performance with foreign key and inner join
* Detect face and blur video background through TensorFlow Blazeface
* Support Google OAuth 2.0 login
* Authorize members using JSON Web Tokens
* Get current position by geolocation in Leaflet
* Combine Bootstrap and custom CSS for RWD





