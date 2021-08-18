# Friendzone
The project aim at connecting families and friends’ bond closely, with sharing our own location to each other, and contacting people instantly by text messages or video calls.</br>
Website link: https://friendzone.tw/</br>
Test account: test@gmail.com</br>
Test password: test</br>
Also can register your own account or use Google login.

## Architecture
![structre拷貝](https://user-images.githubusercontent.com/73774991/129366481-273dd3b3-ddc9-4799-9ebf-d0e863d6430e.png)


## Database Structure (MySQL)
![database](https://user-images.githubusercontent.com/73774991/129360399-68d2c26d-f313-4bb5-b7f1-d25891ff94bb.png)

## Main Features
### Location Sharing
Watch friends’ current position if they allow, also can see the last update time about the position.</br>
![gif-01](https://user-images.githubusercontent.com/73774991/129359846-49ea8390-9f10-4100-9605-6ec3d9ca82b1.gif)
### Distance Broadcasting
Send messages to a bunch of friends once without texting them one by one, just setting the specific distance you want.</br>
![gif-03](https://user-images.githubusercontent.com/73774991/129359902-aa008137-3c63-4fe3-bfd5-316c14d4ac9e.gif)
### Real-time Message
Send real-time messages to friends, if they are online they can immediately receive the notifications and send you back.</br>
![gif-02](https://user-images.githubusercontent.com/73774991/129359894-c1e72dc4-7ffe-4e6a-9f5f-83318fb362e6.gif)
![gif-05](https://user-images.githubusercontent.com/73774991/129360060-6039fbcb-9b51-4df8-9030-3aaa133a3dda.gif)
### Video Call
Call friends directly if you prefer communicating with others by voice and face.</br>
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

## Side Features
### Login / Register
Register your own account or use Google login.</br>
![local_gif-06](https://user-images.githubusercontent.com/73774991/129489023-1054a6c9-006a-49ac-af9d-c407f49b493e.gif)
### Member Data
Easily change your profile picture or display name.</br>
![local_gif-07](https://user-images.githubusercontent.com/73774991/129489025-0c99c76a-a933-47d2-90aa-2fe951b7b133.gif)
### Friend Request
Add friend by their email, account in this website is always unique.</br>
![local_gif-08](https://user-images.githubusercontent.com/73774991/129489028-57142345-ac65-4ca3-b05f-3a621d301f32.gif)







